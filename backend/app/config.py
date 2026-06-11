from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_image_model: str = "google/gemini-2.5-flash-image"
    cors_origins: str = "http://localhost:5173"
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""
    upstash_redis_url: str = ""
    upstash_redis_token: str = ""

    @property
    def redis_url(self) -> str:
        """Accept both Upstash-default (REST_) and short env var names."""
        return self.upstash_redis_rest_url or self.upstash_redis_url

    @property
    def redis_token(self) -> str:
        """Accept both Upstash-default (REST_) and short env var names."""
        return self.upstash_redis_rest_token or self.upstash_redis_token
    # Per-action limits within the rolling window (per IP).
    rate_limit_generate_max: int = 1
    rate_limit_image_max: int = 2
    rate_limit_text_max: int = 5
    rate_limit_window_seconds: int = 432000  # 5 days


settings = Settings()
