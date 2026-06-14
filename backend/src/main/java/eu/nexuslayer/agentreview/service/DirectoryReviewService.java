package eu.nexuslayer.agentreview.service;

import eu.nexuslayer.agentreview.dto.DirectoryReviewRequest;
import eu.nexuslayer.agentreview.dto.ReviewFileDto;
import eu.nexuslayer.agentreview.dto.ReviewRequest;
import eu.nexuslayer.agentreview.model.ReviewMode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DirectoryReviewService {

    private static final long MAX_FILE_SIZE_BYTES = 512 * 1024; // 512KB per file
    private static final int MAX_FILES = 50;

    private static final Set<String> DEFAULT_EXTENSIONS = Set.of(
            "java", "kt", "scala", "py", "ts", "tsx", "js", "jsx",
            "go", "rs", "cs", "cpp", "c", "h", "rb", "php");

    public ReviewRequest buildReviewRequest(DirectoryReviewRequest req) throws IOException {
        Path dir = Path.of(req.getDirectoryPath());
        if (!Files.exists(dir) || !Files.isDirectory(dir)) {
            throw new IllegalArgumentException("Directory not found: " + req.getDirectoryPath());
        }

        Set<String> extensions = resolveExtensions(req.getLanguage(), req.getIncludeExtensions());
        List<String> excludePatterns = req.getExcludePatterns() != null ? req.getExcludePatterns() : List.of();
        List<ReviewFileDto> files = new ArrayList<>();

        Files.walkFileTree(dir, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                if (files.size() >= MAX_FILES) return FileVisitResult.TERMINATE;
                String name = file.getFileName().toString();
                String ext = getExtension(name);
                if (!extensions.contains(ext)) return FileVisitResult.CONTINUE;
                if (isExcluded(file, dir, excludePatterns)) return FileVisitResult.CONTINUE;
                if (attrs.size() > MAX_FILE_SIZE_BYTES) {
                    log.debug("Skipping large file: {} ({} bytes)", file, attrs.size());
                    return FileVisitResult.CONTINUE;
                }
                try {
                    String content = Files.readString(file, StandardCharsets.UTF_8);
                    String relativePath = dir.relativize(file).toString();
                    ReviewFileDto fileDto = new ReviewFileDto();
                    fileDto.setPath(relativePath);
                    fileDto.setContent(content);
                    files.add(fileDto);
                } catch (IOException e) {
                    log.debug("Could not read file {}: {}", file, e.getMessage());
                }
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult preVisitDirectory(Path dir2, BasicFileAttributes attrs) {
                String name = dir2.getFileName() != null ? dir2.getFileName().toString() : "";
                if (Set.of(".git", "node_modules", "target", "build", "dist", "__pycache__",
                           ".gradle", ".idea", ".vscode").contains(name)) {
                    return FileVisitResult.SKIP_SUBTREE;
                }
                return FileVisitResult.CONTINUE;
            }
        });

        if (files.isEmpty()) throw new IllegalArgumentException("No supported source files found in directory");

        String language = resolveLanguage(req.getLanguage(), files);
        ReviewRequest reviewRequest = new ReviewRequest();
        reviewRequest.setFiles(files);
        reviewRequest.setLanguage(language);
        reviewRequest.setTaskDescription(req.getTaskDescription());
        reviewRequest.setReviewMode(req.getReviewMode() != null ? req.getReviewMode() : ReviewMode.FULL);
        reviewRequest.setAgentId(req.getAgentId());
        reviewRequest.setExecutorConfig(req.getExecutorConfig());
        return reviewRequest;
    }

    private Set<String> resolveExtensions(String language, List<String> requested) {
        if (requested != null && !requested.isEmpty()) return Set.copyOf(requested);
        if (language == null) return DEFAULT_EXTENSIONS;
        return switch (language.toLowerCase()) {
            case "java" -> Set.of("java");
            case "typescript" -> Set.of("ts", "tsx");
            case "javascript" -> Set.of("js", "jsx", "mjs");
            case "python" -> Set.of("py");
            case "go" -> Set.of("go");
            default -> DEFAULT_EXTENSIONS;
        };
    }

    private boolean isExcluded(Path file, Path base, List<String> patterns) {
        String rel = base.relativize(file).toString();
        for (String pat : patterns) {
            if (rel.contains(pat)) return true;
        }
        return false;
    }

    private String getExtension(String name) {
        int dot = name.lastIndexOf('.');
        return dot >= 0 ? name.substring(dot + 1).toLowerCase() : "";
    }

    private String resolveLanguage(String requested, List<ReviewFileDto> files) {
        if (requested != null && !requested.isBlank()) return requested;
        if (files.isEmpty()) return "java";
        // Use majority vote over all file extensions rather than just the first file
        Map<String, Long> extCount = files.stream()
                .filter(f -> f.getPath() != null)
                .collect(Collectors.groupingBy(
                        f -> getExtension(f.getPath()),
                        Collectors.counting()));
        String dominantExt = extCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("");
        return switch (dominantExt) {
            case "java" -> "java";
            case "ts", "tsx" -> "typescript";
            case "js", "jsx", "mjs" -> "javascript";
            case "py" -> "python";
            case "go" -> "go";
            default -> "java";
        };
    }
}
