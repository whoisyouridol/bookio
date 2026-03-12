# ── Stage 1: restore & build ──────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only .csproj files first — separate layer so restore is cached
# unless project files change
COPY src/BeautySalonBooking.API/BeautySalonBooking.API.csproj                         src/BeautySalonBooking.API/
COPY src/BeautySalonBooking.Application/BeautySalonBooking.Application.csproj         src/BeautySalonBooking.Application/
COPY src/BeautySalonBooking.Infrastructure/BeautySalonBooking.Infrastructure.csproj   src/BeautySalonBooking.Infrastructure/
COPY src/BeautySalonBooking.Domain/BeautySalonBooking.Domain.csproj                   src/BeautySalonBooking.Domain/

RUN dotnet restore src/BeautySalonBooking.API/BeautySalonBooking.API.csproj

COPY . .

RUN dotnet publish src/BeautySalonBooking.API/BeautySalonBooking.API.csproj \
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

ENTRYPOINT ["dotnet", "BeautySalonBooking.API.dll"]
