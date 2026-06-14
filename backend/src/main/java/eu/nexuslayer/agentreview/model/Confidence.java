package eu.nexuslayer.agentreview.model;

public enum Confidence {
    HIGH(1.0), MEDIUM(0.7), LOW(0.4);

    private final double multiplier;

    Confidence(double multiplier) {
        this.multiplier = multiplier;
    }

    public double getMultiplier() {
        return multiplier;
    }
}
