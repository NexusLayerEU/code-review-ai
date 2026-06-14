package eu.nexuslayer.agentreview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AgentReviewApplication {
    public static void main(String[] args) {
        SpringApplication.run(AgentReviewApplication.class, args);
    }
}
