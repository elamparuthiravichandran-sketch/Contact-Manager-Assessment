FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY src/Contacts.Api/Contacts.Api.csproj src/Contacts.Api/
RUN dotnet restore src/Contacts.Api/Contacts.Api.csproj
COPY src/Contacts.Api/ src/Contacts.Api/
RUN dotnet publish src/Contacts.Api/Contacts.Api.csproj -c Release -o /out --no-restore
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out .
RUN mkdir logs && chown app:app logs
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "Contacts.Api.dll"]
