import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Bindings } from "..";
import dayjs from "dayjs";

interface RateLimitInfo {
	count: number;
	timestamp: number;
}

const RATE_LIMIT = 5;
const WINDOW_SIZE = 60 * 1000; // in ms

const getRateLimitKey = (c: Context): string => {
	const ip =
		c.req.header("cf-connecting-ip") ||
		c.req.header("x-forwarded-for") ||
		"unknown";
	return `ratelimit:${ip}`;
};

export const rateLimiter: MiddlewareHandler<{ Bindings: Bindings }> = async (
	c,
	next,
) => {
	const key = getRateLimitKey(c);
	try {
		const rateLimitInfoStr = await c.env.RATE_LIMIT_KV.get(key);
		const now = dayjs();

		let rateLimitInfo: RateLimitInfo;
		if (rateLimitInfoStr) {
			rateLimitInfo = JSON.parse(rateLimitInfoStr);

			if (now.valueOf() - rateLimitInfo.timestamp > WINDOW_SIZE) {
				rateLimitInfo = {
					count: 1,
					timestamp: now.valueOf(),
				};
			} else if (rateLimitInfo.count >= RATE_LIMIT) {
				const remainingTime = Math.ceil(
					(WINDOW_SIZE - (now.valueOf() - rateLimitInfo.timestamp)) / 1000,
				);

				throw new HTTPException(429, {
					message: `Rate limit exceeded. Try again in ${remainingTime} seconds`,
				});
			} else {
				rateLimitInfo.count++;
			}
		} else {
			rateLimitInfo = {
				count: 1,
				timestamp: now.valueOf(),
			};
		}

		await c.env.RATE_LIMIT_KV.put(key, JSON.stringify(rateLimitInfo), {
			expirationTtl: WINDOW_SIZE / 1000,
		});

		c.header("X-RateLimit-Limit", RATE_LIMIT.toString());
		c.header(
			"X-RateLimit-Remaining",
			(RATE_LIMIT - rateLimitInfo.count).toString(),
		);
		c.header(
			"X-RateLimit-Reset",
			dayjs(rateLimitInfo.timestamp)
				.add(WINDOW_SIZE, "millisecond")
				.valueOf()
				.toString(),
		);

		await next();
	} catch (error) {
		if (error instanceof HTTPException) {
			throw error;
		}
		throw new HTTPException(500, { message: "Rate limiting error" });
	}
};
