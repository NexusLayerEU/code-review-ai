package eu.nexuslayer.agentreview.llm;

import eu.nexuslayer.agentreview.dto.ExecutorConfigDto;
import eu.nexuslayer.agentreview.llm.executor.AnthropicApiExecutor;
import eu.nexuslayer.agentreview.llm.executor.AntGravityCliExecutor;
import eu.nexuslayer.agentreview.llm.executor.ClaudeCodeCliExecutor;
import eu.nexuslayer.agentreview.model.ExecutorType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class LLMExecutorFactory {

    @Value("${anthropic.api.key:}")
    private String defaultApiKey;

    @Value("${anthropic.api.model:claude-sonnet-4-6}")
    private String defaultModel;

    public LLMExecutor create(ExecutorConfigDto config) {
        if (config == null) {
            return new AnthropicApiExecutor(defaultApiKey, defaultModel);
        }
        ExecutorType type = config.getType() != null ? config.getType() : ExecutorType.CLAUDE_API;
        return switch (type) {
            case CLAUDE_API -> {
                String key = config.getApiKey() != null ? config.getApiKey() : defaultApiKey;
                String model = config.getModel() != null ? config.getModel() : defaultModel;
                yield new AnthropicApiExecutor(key, model);
            }
            case CLAUDE_CLI -> {
                String path = config.getCliPath() != null ? config.getCliPath() : "claude";
                yield new ClaudeCodeCliExecutor(path, config.getExtraArgs());
            }
            case ANTIGRAVITY_CLI -> {
                String path = config.getCliPath() != null ? config.getCliPath() : "antigravity";
                yield new AntGravityCliExecutor(path, config.getExtraArgs());
            }
            case REMOTE_SKILL -> new AnthropicApiExecutor(defaultApiKey, defaultModel);
        };
    }
}
