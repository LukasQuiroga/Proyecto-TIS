package com.lacomarcasoft.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;



@Configuration
public class MailConfig {


    @Bean
    public JavaMailSender javaMailSender(){

        JavaMailSenderImpl sender =
                new JavaMailSenderImpl();


        sender.setHost("localhost");

        sender.setPort(25);


        return sender;

    }


}
