# ── Stage 1: restore & build ──────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only .csproj files first — separate layer so restore is cached
# unless project files change
COPY backend/src/Bookio.API/Bookio.API.csproj                       backend/src/Bookio.API/
COPY backend/src/Bookio.Application/Bookio.Application.csproj       backend/src/Bookio.Application/
COPY backend/src/Bookio.Infrastructure/Bookio.Infrastructure.csproj backend/src/Bookio.Infrastructure/
COPY backend/src/Bookio.Domain/Bookio.Domain.csproj                 backend/src/Bookio.Domain/

RUN dotnet restore backend/src/Bookio.API/Bookio.API.csproj

COPY . .

RUN dotnet publish backend/src/Bookio.API/Bookio.API.csproj \
    -c Release -o /app/publish --no-restore

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install curl for health check, then create non-root user
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

COPY --from=build /app/publish .

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "Bookio.API.dll"]
