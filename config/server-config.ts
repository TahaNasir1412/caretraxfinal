// Server Configuration - Updated with your correct IP
export const SERVER_CONFIG = {
  // Your computer's IP address from the network info you provided
  BASE_URL: "http://192.168.236.194:8000",

  WEIGHT_ENDPOINT: "/weight",
  POLL_INTERVAL: 2000, // 2 seconds
}

export const getWeightUrl = () => {
  return `${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.WEIGHT_ENDPOINT}`
}
