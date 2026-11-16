# Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# Run
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --create-home marketplace && mkdir -p /data/photos && chown -R marketplace /data
USER marketplace
COPY --from=build /app/target/student-marketplace-1.0.0.jar app.jar
ENV PHOTO_DIR=/data/photos
EXPOSE 8080
# The JRE image has no curl/wget; bash's /dev/tcp is enough to prove the port is open.
# docker-compose.prod.yml waits for this health check before starting the frontend.
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s --retries=5 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080' || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
