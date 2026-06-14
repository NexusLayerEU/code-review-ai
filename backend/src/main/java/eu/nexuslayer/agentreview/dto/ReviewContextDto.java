package eu.nexuslayer.agentreview.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ReviewContextDto {
    private Map<String, String> dependencies;
    private List<String> existingCodeSnippets;
    private String apiDocs;
}
