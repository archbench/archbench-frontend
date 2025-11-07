Edge requests flow through a rate-limiting tier backed by a fast data store. Goal is to reject overflow within 5ms while keeping the limiter tier cost-efficient.
