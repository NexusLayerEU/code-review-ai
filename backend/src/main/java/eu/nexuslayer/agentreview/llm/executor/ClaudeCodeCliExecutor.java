package eu.nexuslayer.agentreview.llm.executor;

import eu.nexuslayer.agentreview.llm.LLMExecutor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@RequiredArgsConstructor
public class ClaudeCodeCliExecutor implements LLMExecutor {

    private final String cliPath;
    private final String extraArgs;
    private static final int TIMEOUT_SECONDS = 120;

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        String fullPrompt = (systemPrompt != null && !systemPrompt.isBlank())
                ? "SYSTEM:\n" + systemPrompt + "\n\nUSER:\n" + userPrompt
                : userPrompt;

        List<String> cmd = new ArrayList<>();
        cmd.add(cliPath != null ? cliPath : "claude");
        cmd.add("--print");
        if (extraArgs != null && !extraArgs.isBlank()) {
            for (String arg : extraArgs.trim().split("\\s+")) cmd.add(arg);
        }
        cmd.add("-p");
        cmd.add(fullPrompt);

        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(false);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) output.append(line).append("\n");
            }

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("Claude CLI timed out after " + TIMEOUT_SECONDS + "s");
            }
            if (process.exitValue() != 0) {
                log.warn("Claude CLI exited with code {}", process.exitValue());
            }
            return output.toString().trim();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Claude CLI execution failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String getType() { return "claude_cli"; }
}
