
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

            // Register EthnoVet Core Services
            builder.Services.AddSingleton<EthnovetChat.DataAccessLayer.Repositories.IEthnovetRepository, EthnovetChat.DataAccessLayer.Repositories.EthnovetRepository>();
            builder.Services.AddSingleton<EthnovetChat.ServiceLayer.Services.ISessionService, EthnovetChat.ServiceLayer.Services.SessionService>();
            builder.Services.AddSingleton<EthnovetChat.ServiceLayer.Services.IRagService, EthnovetChat.ServiceLayer.Services.RagService>();
            builder.Services.AddHttpClient<EthnovetChat.ServiceLayer.Services.IGeminiService, EthnovetChat.ServiceLayer.Services.GeminiService>();
            builder.Services.AddScoped<EthnovetChat.ServiceLayer.Services.IChatService, EthnovetChat.ServiceLayer.Services.ChatService>();
            builder.Services.AddSingleton<EthnovetChat.ServiceLayer.Services.IAdminAuthService, EthnovetChat.ServiceLayer.Services.AdminAuthService>();

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
