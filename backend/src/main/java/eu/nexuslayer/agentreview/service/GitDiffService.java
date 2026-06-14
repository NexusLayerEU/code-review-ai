package eu.nexuslayer.agentreview.service;

import eu.nexuslayer.agentreview.dto.GitDiffReviewRequest;
import eu.nexuslayer.agentreview.dto.ReviewFileDto;
import eu.nexuslayer.agentreview.dto.ReviewRequest;
import eu.nexuslayer.agentreview.model.ReviewMode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
public class GitDiffService {

    private static final int GIT_TIMEOUT = 60;
    private static final int MAX_DIFF_CHARS = 80_000;

    public ReviewRequest buildReviewRequest(GitDiffReviewRequest req) throws IOException, InterruptedException {
        String workDir;
        boolean tempClone = false;
        Path tempDir = null;

        if (req.getLocalRepoPath() != null && !req.getLocalRepoPath().isBlank()) {
            workDir = req.getLocalRepoPath();
        } else if (req.getRepoUrl() != null && !req.getRepoUrl().isBlank()) {
            tempDir = Files.createTempDirectory("agentreview-git-");
            tempClone = true;
            cloneRepo(req.getRepoUrl(), req.getAccessToken(), tempDir.toString());
            workDir = tempDir.toString();
        } else {
            throw new IllegalArgumentException("Either localRepoPath or repoUrl is required");
        }

        try {
            String diffOutput;
            if (req.getBranch1() != null && req.getBranch2() != null) {
                diffOutput = runGitDiff(workDir, req.getBranch1(), req.getBranch2());
            } else if (req.getPrNumber() != null) {
                fetchPr(workDir, req.getPrNumber());
                diffOutput = runGitDiff(workDir, "HEAD", "FETCH_HEAD");
            } else {
                diffOutput = runGitDiff(workDir, "HEAD~1", "HEAD");
            }

            if (diffOutput.isBlank()) throw new IllegalStateException("No diff found between the specified refs");
            if (diffOutput.length() > MAX_DIFF_CHARS) diffOutput = diffOutput.substring(0, MAX_DIFF_CHARS) + "\n... [diff truncated]";

            List<ReviewFileDto> files = parseDiffIntoFiles(diffOutput);
            if (files.isEmpty()) {
                ReviewFileDto single = new ReviewFileDto();
                single.setPath("diff.patch");
                single.setContent(diffOutput);
                single.setDiff(true);
                files = List.of(single);
            }

            String language = req.getLanguage() != null ? req.getLanguage() : detectLanguage(files);
            ReviewRequest reviewRequest = new ReviewRequest();
            reviewRequest.setFiles(files);
            reviewRequest.setLanguage(language);
            reviewRequest.setTaskDescription(req.getTaskDescription());
            reviewRequest.setReviewMode(req.getReviewMode() != null ? req.getReviewMode() : ReviewMode.FULL);
            reviewRequest.setAgentId(req.getAgentId());
            reviewRequest.setExecutorConfig(req.getExecutorConfig());
            return reviewRequest;
        } finally {
            if (tempClone && tempDir != null) deleteTempDir(tempDir);
        }
    }

    private void cloneRepo(String repoUrl, String token, String targetDir) throws IOException, InterruptedException {
        String cloneUrl = repoUrl;
        if (token != null && !token.isBlank() && repoUrl.startsWith("https://")) {
            cloneUrl = repoUrl.replace("https://", "https://oauth2:" + token + "@");
        }
        try {
            runCommand(targetDir, "git", "clone", "--depth", "50", cloneUrl, ".");
        } catch (RuntimeException e) {
            // Re-throw without the clone URL (which may contain an embedded token)
            throw new RuntimeException("git clone failed for repository: " + repoUrl);
        }
    }

    private void fetchPr(String workDir, String prNumber) throws IOException, InterruptedException {
        runCommand(workDir, "git", "fetch", "origin", "refs/pull/" + prNumber + "/head:FETCH_HEAD");
    }

    private String runGitDiff(String workDir, String ref1, String ref2) throws IOException, InterruptedException {
        return runCommand(workDir, "git", "diff", ref1 + ".." + ref2, "--", ".");
    }

    private String runCommand(String workDir, String... cmd) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(cmd).directory(Path.of(workDir).toFile()).redirectErrorStream(false);
        Process process = pb.start();
        StringBuilder out = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) out.append(line).append("\n");
        }
        boolean done = process.waitFor(GIT_TIMEOUT, TimeUnit.SECONDS);
        if (!done) { process.destroyForcibly(); throw new RuntimeException("Git command timed out: " + Arrays.toString(cmd)); }
        return out.toString();
    }

    private List<ReviewFileDto> parseDiffIntoFiles(String diff) {
        List<ReviewFileDto> files = new ArrayList<>();
        String[] lines = diff.split("\n");
        String currentFile = null;
        StringBuilder currentContent = new StringBuilder();

        for (String line : lines) {
            if (line.startsWith("diff --git ")) {
                if (currentFile != null && !currentContent.isEmpty()) {
                    ReviewFileDto f = new ReviewFileDto();
                    f.setPath(currentFile);
                    f.setContent(currentContent.toString());
                    f.setDiff(true);
                    files.add(f);
                }
                String[] parts = line.split(" b/", 2);
                currentFile = parts.length > 1 ? parts[1].trim() : "unknown";
                currentContent = new StringBuilder();
            } else if (currentFile != null) {
                currentContent.append(line).append("\n");
            }
        }
        if (currentFile != null && !currentContent.isEmpty()) {
            ReviewFileDto f = new ReviewFileDto();
            f.setPath(currentFile);
            f.setContent(currentContent.toString());
            f.setDiff(true);
            files.add(f);
        }
        return files;
    }

    private String detectLanguage(List<ReviewFileDto> files) {
        Map<String, Long> extCount = files.stream()
                .filter(f -> f.getPath() != null && f.getPath().contains("."))
                .collect(Collectors.groupingBy(
                        f -> {
                            String p = f.getPath();
                            return p.substring(p.lastIndexOf('.') + 1).toLowerCase();
                        },
                        Collectors.counting()
                ));
        return extCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> switch (e.getKey()) {
                    case "java" -> "java";
                    case "ts", "tsx" -> "typescript";
                    case "js", "jsx" -> "javascript";
                    case "py" -> "python";
                    case "go" -> "go";
                    default -> "java";
                })
                .orElse("java");
    }

    private void deleteTempDir(Path dir) {
        try {
            Files.walk(dir).sorted(Comparator.reverseOrder()).forEach(p -> {
                try { Files.deleteIfExists(p); } catch (IOException ignored) {}
            });
        } catch (IOException e) {
            log.warn("Could not clean up temp dir {}: {}", dir, e.getMessage());
        }
    }
}
