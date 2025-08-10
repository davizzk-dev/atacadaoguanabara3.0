package com.atacadao.guanabara;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GuanabaraApplication {

    public static void main(String[] args) {
        SpringApplication.run(GuanabaraApplication.class, args);
        System.out.println("🚀 Atacadão Guanabara Backend iniciado com sucesso!");
        System.out.println("📊 API disponível em: http://localhost:8080");
        System.out.println("🗄️  Banco H2 Console: http://localhost:8080/h2-console");
    }
} 