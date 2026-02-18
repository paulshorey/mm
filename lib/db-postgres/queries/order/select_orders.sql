-- name: select_orders
-- Filters are optional and should be appended by adapters.
SELECT *
FROM order_v1
ORDER BY time DESC
LIMIT $1;
