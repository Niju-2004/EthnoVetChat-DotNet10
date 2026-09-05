# Build stage for .NET 10 Web API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["EthnovetChat.DataAccessLayer/EthnovetChat.DataAccessLayer.csproj", "EthnovetChat.DataAccessLayer/"]
COPY ["EthnovetChat.ServiceLayer/EthnovetChat.ServiceLayer.csproj", "EthnovetChat.ServiceLayer/"]

RUN dotnet restore "EthnovetChat.ServiceLayer/EthnovetChat.ServiceLayer.csproj"

# Copy all source files
COPY . .

# Build and publish release binaries
WORKDIR "/src/EthnovetChat.ServiceLayer"
RUN dotnet publish "EthnovetChat.ServiceLayer.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage using official .NET 10 ASP.NET image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Cloud container port
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "EthnovetChat.ServiceLayer.dll"]
