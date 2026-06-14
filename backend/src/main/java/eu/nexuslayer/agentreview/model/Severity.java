package eu.nexuslayer.agentreview.model;

public enum Severity {
    CRITICAL(25), HIGH(15), MEDIUM(8), LOW(3), INFO(1);

    private final int weight;

    Severity(int weight) {
        this.weight = weight;
    }

    public int getWeight() {
        return weight;
    }
}
