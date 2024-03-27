FROM openjdk:17-jdk as build

ARG JAR_FILE=./build/libs/insecure-java-0.0.1-SNAPSHOT.jar

COPY ${JAR_FILE} app.jar

ENTRYPOINT ["java","-jar","/app.jar"]
