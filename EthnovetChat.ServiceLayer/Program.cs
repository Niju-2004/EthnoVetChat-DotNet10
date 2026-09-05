using Microsoft.EntityFrameworkCore;
using EthnovetChat.DataAccessLayer.Data;
using EthnovetChat.DataAccessLayer.Repositories;
using EthnovetChat.ServiceLayer.Services;

namespace EthnovetChat.ServiceLayer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddOpenApi();

            // Configure forwarded headers for cloud reverse proxies (Render, Cloudflare, etc.)
            builder.Services.Configure<Microsoft.AspNetCore.Builder.ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor |
                                           Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto;
                options.KnownIPNetworks.Clear();
                options.KnownProxies.Clear();
            });

            // Configure Neon.tech PostgreSQL Database (with local in-memory fallback if not yet set)
            var neonConn = builder.Configuration.GetConnectionString("NeonPostgres")
                ?? Environment.GetEnvironmentVariable("ConnectionStrings__NeonPostgres")
                ?? Environment.GetEnvironmentVariable("DATABASE_URL");

            if (!string.IsNullOrWhiteSpace(neonConn) && !neonConn.Contains("YOUR_NEON_"))
            {
                builder.Services.AddDbContext<EthnovetDbContext>(options =>
                    options.UseNpgsql(neonConn));
            }
            else
            {
                builder.Services.AddDbContext<EthnovetDbContext>(options =>
                    options.UseInMemoryDatabase("EthnovetChat_Db"));
            }

            // Register EthnoVet Core Services
            builder.Services.AddSingleton<IEthnovetRepository, EthnovetRepository>();
            builder.Services.AddSingleton<ISessionService, SessionService>();
            builder.Services.AddSingleton<IRagService, RagService>();
            builder.Services.AddHttpClient<IGeminiService, GeminiService>();
            builder.Services.AddScoped<IChatService, ChatService>();
            builder.Services.AddSingleton<IAdminAuthService, AdminAuthService>();
            builder.Services.AddScoped<IUserAuthService, UserAuthService>();

            // Enable CORS for web / mobile clients
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            // Enable dynamic port binding for cloud environments (e.g. Render, Railway)
            var port = Environment.GetEnvironmentVariable("PORT");
            if (!string.IsNullOrEmpty(port))
            {
                builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
            }

            var app = builder.Build();

            // Automatic Database Initialization (ensures tables exist on startup)
            using (var scope = app.Services.CreateScope())
            {
                try
                {
                    var db = scope.ServiceProvider.GetRequiredService<EthnovetDbContext>();
                    db.Database.EnsureCreated();
                }
                catch (Exception ex)
                {
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                    logger.LogWarning("Database initialization note: {Message}", ex.Message);
                }
            }

            app.UseForwardedHeaders();

            // Enable Swagger / OpenAPI for easy cloud testing and documentation
            app.MapOpenApi();
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/openapi/v1.json", "EthnoVet Chat API v1");
                options.RoutePrefix = "swagger";
            });

            if (app.Environment.IsDevelopment())
            {
                Scalar.AspNetCore.ScalarEndpointRouteBuilderExtensions.MapScalarApiReference(app);
                app.UseHttpsRedirection();
            }

            // Redirect root to swagger
            app.MapGet("/", () => Results.Redirect("/swagger"));

            app.UseCors("AllowAll");

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}

