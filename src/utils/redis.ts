import Redis from "ioredis";

const redisClient = new Redis(
  "rediss://default:AUstAAIjcDFmMmYzY2VmZGZkMDM0OWFmOTlhMTA5OTUxNzQ0YjUxYnAxMA@immortal-condor-19245.upstash.io:6379"
);

export default redisClient;
