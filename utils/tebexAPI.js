import axios from "axios"

const TEBEX_PLUGIN_API = "https://plugin.tebex.io"

/**
 * Get recent payments from Tebex store
 * @returns {Promise<Array>} Array of recent payments
 */
async function getRecentPayments() {
    try {
        const response = await axios.get(`${TEBEX_PLUGIN_API}/payments`, {headers: {"X-Tebex-Secret": process.env.TEBEX_SECRET_KEY}, params: {limit: 100}})
        return response.data || []
    } catch (error) {
        if (error.response?.data) {
            console.error("📄 Resposta de erro:", JSON.stringify(error.response.data, null, 2))
        }
        return []
    }
}

/**
 * Format payment data to standard structure
 * @param {object} payment - Raw payment data from Tebex
 * @returns {object} Formatted payment data
 */
function formatPayment(payment) {
    const formatted = {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency?.iso_4217 || payment.currency?.symbol || "USD",
        date: payment.date,
        player: {
            name: payment.player?.name || "Unknown",
            id: payment.player?.id || "N/A",
        },
        packages: payment.packages?.map(pkg => {
            return {id: pkg.id, name: pkg.name, quantity: pkg.quantity || 1, image: pkg.image || null}
        }) || [],
        status: payment.status,
    }
    return formatted
}

/**
 * Get payment information from Tebex by transaction ID OR basket ident
 * @param {string} transactionId - The Tebex transaction ID, basket ident, or payment ID
 * @returns {Promise<object|null>} Payment data or null if not found
 */
export async function getTebexPayment(transactionId) {
    const paymentId = transactionId.trim()
    try {
        const response = await axios.get(`${TEBEX_PLUGIN_API}/payments/${paymentId}`, {headers: {"X-Tebex-Secret": process.env.TEBEX_SECRET_KEY, "Content-Type": "application/json"}, timeout: 5000})
        if (response.data && response.data.id) {
            return formatPayment(response.data)
        }
    } catch (error) {
        try {
            const recentPayments = await getRecentPayments()
            const payment = recentPayments.find(p => p.id?.toString() === paymentId)
            if (payment) {
                return formatPayment(payment)
            }
        } catch (searchError) {}
    }
    return null
}

/**
 * Get package details from Tebex by name (Headless API)
 * @param {string} packageName - The package name from Plugin API
 * @returns {Promise<object|null>} Package data or null if not found
 */
export async function getTebexPackageByName(packageName) {
    try {
        if (!process.env.TEBEX_WEBSTORE_ID) {
            return null
        }
        const url = `https://headless.tebex.io/api/accounts/${process.env.TEBEX_WEBSTORE_ID}/categories?includePackages=1`
        const response = await axios.get(url, {headers: {"Accept": "application/json", "User-Agent": "ULOG-Discord-Bot/1.0"}})
        const products = []
        if (response.data && response.data.data) {
            response.data.data.forEach(category => {
                if (category.packages && Array.isArray(category.packages)) {
                    category.packages.forEach(product => {
                        products.push({id: product.id, name: product.name, description: product.description, price: product.total_price, currency: product.currency, image: product.image || null})
                    })
                }
            })
        }
        if (products.length === 0) {
            return null
        }
        const matchedPackage = products.find(pkg => {
            const match = pkg.name.toLowerCase() === packageName.toLowerCase()
            if (match) {}
            return match
        })
        if (matchedPackage) {
            return matchedPackage
        } else {}
        return null
    } catch (error) {
        return null
    }
}