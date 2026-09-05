using Microsoft.AspNetCore.Mvc;
using EthnovetChat.ServiceLayer.DTOs;
using EthnovetChat.ServiceLayer.Services;

namespace EthnovetChat.ServiceLayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IUserAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        private Guid? GetAuthenticatedUserId()
        {
            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            return _authService.ValidateTokenAndGetUserId(authHeader);
        }

        /// <summary>
        /// Register a new farmer account (Stage 3 submission of 3-stage wizard).
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid input details."
                });
            }

            var result = await _authService.RegisterAsync(request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Authenticate an existing farmer account and receive a JWT token.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Email/Username and password are required."
                });
            }

            var result = await _authService.LoginAsync(request, cancellationToken);
            if (!result.Success)
            {
                return Unauthorized(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get the currently authenticated farmer's profile.
        /// </summary>
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
        {
            var userId = GetAuthenticatedUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Authentication token missing or expired." });
            }

            var user = await _authService.GetUserByIdAsync(userId.Value, cancellationToken);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(user);
        }

        /// <summary>
        /// Update user's preferred language after login.
        /// </summary>
        [HttpPut("language")]
        public async Task<IActionResult> UpdateLanguage([FromBody] UpdateLanguageDto request, CancellationToken cancellationToken)
        {
            var userId = GetAuthenticatedUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Authentication token missing or expired." });
            }

            var updated = await _authService.UpdatePreferredLanguageAsync(userId.Value, request.Language, cancellationToken);
            if (!updated)
            {
                return BadRequest(new { message = "Failed to update language." });
            }

            return Ok(new { success = true, language = request.Language });
        }
    }
}

