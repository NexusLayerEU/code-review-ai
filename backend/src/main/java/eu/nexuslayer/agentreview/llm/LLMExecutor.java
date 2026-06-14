package eu.nexuslayer.agentreview.llm;

public interface LLMExecutor {
    String complete(String systemPrompt, String userPrompt);
    String getType();
}
