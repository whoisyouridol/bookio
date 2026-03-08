FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/BeautySalonBooking.API/BeautySalonBooking.API.csproj", "src/BeautySalonBooking.API/"]
COPY ["src/BeautySalonBooking.Application/BeautySalonBooking.Application.csproj", "src/BeautySalonBooking.Application/"]
COPY ["src/BeautySalonBooking.Infrastructure/BeautySalonBooking.Infrastructure.csproj", "src/BeautySalonBooking.Infrastructure/"]
COPY ["src/BeautySalonBooking.Domain/BeautySalonBooking.Domain.csproj", "src/BeautySalonBooking.Domain/"]

RUN dotnet restore "src/BeautySalonBooking.API/BeautySalonBooking.API.csproj"

COPY . .

RUN dotnet publish "src/BeautySalonBooking.API/BeautySalonBooking.API.csproj" \
    -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "BeautySalonBooking.API.dll"]
