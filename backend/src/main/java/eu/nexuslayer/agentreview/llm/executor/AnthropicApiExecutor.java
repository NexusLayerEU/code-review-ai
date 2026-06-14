package eu.nexuslayer.agentreview.llm.executor;

import eu.nexuslayer.agentreview.llm.LLMExecutor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class AnthropicApiExecutor implements LLMExecutor {

    private final String apiKey;
    private final String model;
    private static final String API_URL = "https://api.anthropic.com/v1/messages";

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        var client = RestClient.create();
        var body = Map.of(
                "model", model,
                "max_tokens", 4096,
                "system", systemPrompt,
                "messages", List.of(Map.of("role", "user", "content", userPrompt))
        );
        try {
            @SuppressWarnings("unchecked")
            var response = client.post()
                    .uri(API_URL)
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (response == null) return "";
            @SuppressWarnings("unchecked")
            var content = (List<Map<String, Object>>) response.get("content");
            if (content == null || content.isEmpty()) return "";
            return String.valueOf(content.get(0).getOrDefault("text", ""));
        } catch (Exception e) {
            log.error("Anthropic API call failed: {}", e.getMessage());
            throw new RuntimeException("LLM API call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String getType() { return "claude_api"; }
}
