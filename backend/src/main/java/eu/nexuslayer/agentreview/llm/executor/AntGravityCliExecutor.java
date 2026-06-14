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
public class AntGravityCliExecutor implements LLMExecutor {

    private final String cliPath;
    private final String extraArgs;
    private static final int TIMEOUT_SECONDS = 120;

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        String fullPrompt = (systemPrompt != null && !systemPrompt.isBlank())
                ? systemPrompt + "\n\n" + userPrompt
                : userPrompt;

        List<String> cmd = new ArrayList<>();
        cmd.add(cliPath != null ? cliPath : "antigravity");
        cmd.add("ask");
        cmd.add(fullPrompt);
        if (extraArgs != null && !extraArgs.isBlank()) {
            for (String arg : extraArgs.trim().split("\\s+")) cmd.add(arg);
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) output.append(line).append("\n");
            }

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) { process.destroyForcibly(); throw new RuntimeException("Antigravity CLI timed out"); }
            return output.toString().trim();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Antigravity CLI execution failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String getType() { return "antigravity_cli"; }
}
