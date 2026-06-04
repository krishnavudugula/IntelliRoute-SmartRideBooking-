/**
 * ══════════════════════════════════════════════════════════════════
 *  IntelliRoute — Smart Fare Estimation
 * ══════════════════════════════════════════════════════════════════
 *
 *  Calculates dynamic fares based on:
 *  - Distance
 *  - Traffic conditions
 *  - Weather (rain, fog)
 *  - Time of day (peak hours)
 *  - Ride type (bike, auto, cab)
 *  - Surge pricing
 *
 *  Usage:
 *    const estimator = new FareEstimator();
 *    const fare = estimator.calculate({
 *      distance: 5.2,      // km
 *      duration: 12,       // minutes
 *      rideType: 'cab',    // 'bike', 'auto', 'cab'
 *      traffic: 'heavy',   // 'light', 'moderate', 'heavy'
 *      weather: 'rain',    // 'clear', 'rain', 'fog'
 *    });
 */

class FareEstimator {
  constructor() {
    // Base fares by ride type (in rupees)
    this.baseFares = {
      bike: 20,
      auto: 30,
      cab: 50,
    };

    // Per km rates
    this.perKmRates = {
      bike: 12,
      auto: 15,
      cab: 20,
    };

    // Per minute rates (waiting/traffic)
    this.perMinuteRates = {
      bike: 0.8,
      auto: 1.2,
      cab: 1.5,
    };

    // Traffic multipliers
    this.trafficMultipliers = {
      light: 1.0,
      moderate: 1.15,
      heavy: 1.35,
    };

    // Weather multipliers
    this.weatherMultipliers = {
      clear: 1.0,
      rain: 1.25,
      fog: 1.15,
    };

    // Peak hour surges
    this.peakHourMultiplier = 1.4;
  }

  /**
   * Calculate fare for a ride
   * @param {Object} options
   * @returns {Object} { baseFare, trafficCharge, weatherCharge, surgeFare, totalFare, breakdown }
   */
  calculate(options) {
    const {
      distance = 5,
      duration = 15,
      rideType = 'cab',
      traffic = 'moderate',
      weather = 'clear',
      ispeakHour = false,
      demandRatio = 1,
    } = options;

    // Base fare
    let baseFare = this.baseFares[rideType] || this.baseFares.cab;

    // Distance charge
    const distanceCharge = distance * (this.perKmRates[rideType] || this.perKmRates.cab);

    // Time charge
    const timeCharge = duration * (this.perMinuteRates[rideType] || this.perMinuteRates.cab);

    // Subtotal before multipliers
    let subtotal = baseFare + distanceCharge + timeCharge;

    // Traffic multiplier
    const trafficMul = this.trafficMultipliers[traffic] || 1;
    const trafficCharge = (distanceCharge + timeCharge) * (trafficMul - 1);

    // Weather multiplier
    const weatherMul = this.weatherMultipliers[weather] || 1;
    const weatherCharge = subtotal * (weatherMul - 1);

    // Surge pricing (based on demand ratio)
    let surgeMultiplier = 1;
    if (demandRatio >= 4) surgeMultiplier = 2;
    else if (demandRatio >= 2.5) surgeMultiplier = 1.5;
    else if (demandRatio >= 1) surgeMultiplier = 1.2;
    else surgeMultiplier = 1;

    // Peak hour surge
    if (isPeakHour) surgeMultiplier *= 1.4;

    // Calculate total
    const fareBeforeSurge = subtotal * trafficMul * weatherMul;
    const surgeFare = fareBeforeSurge * (surgeMultiplier - 1);
    const subtotalFare = fareBeforeSurge + surgeFare;

    // Platform fee (5%)
    const platformFee = Math.round(subtotalFare * 0.05);

    // Tax (5%)
    const tax = Math.round((subtotalFare + platformFee) * 0.05);

    // Total
    const totalFare = subtotalFare + platformFee + tax;

    return {
      baseFare: Math.round(baseFare),
      distanceCharge: Math.round(distanceCharge),
      timeCharge: Math.round(timeCharge),
      trafficCharge: Math.round(trafficCharge),
      weatherCharge: Math.round(weatherCharge),
      surgeFare: Math.round(surgeFare),
      platformFee,
      tax,
      totalFare: Math.round(totalFare),
      surgeMultiplier: surgeMultiplier.toFixed(1),
      breakdown: {
        base: `₹${Math.round(baseFare)}`,
        distance: `₹${Math.round(distanceCharge)} (${distance.toFixed(1)}km)`,
        time: `₹${Math.round(timeCharge)} (${duration}min)`,
        traffic: trafficMul > 1 ? `+₹${Math.round(trafficCharge)} (${traffic})` : null,
        weather: weatherMul > 1 ? `+₹${Math.round(weatherCharge)} (${weather})` : null,
        surge: surgeMultiplier > 1 ? `+₹${Math.round(surgeFare)} (${surgeMultiplier.toFixed(1)}x)` : null,
        fee: `+₹${platformFee} (platform)`,
        tax: `+₹${tax} (tax)`,
      },
    };
  }

  /**
   * Get a range of fares (min-max)
   */
  getRange(distance, duration, rideType) {
    const min = this.calculate({
      distance,
      duration,
      rideType,
      traffic: 'light',
      weather: 'clear',
    });

    const max = this.calculate({
      distance,
      duration,
      rideType,
      traffic: 'heavy',
      weather: 'rain',
      demandRatio: 2,
    });

    return {
      minFare: min.totalFare,
      maxFare: max.totalFare,
      estimateFare: Math.round((min.totalFare + max.totalFare) / 2),
    };
  }
}

// Export globally
if (typeof window !== 'undefined') {
  window.FareEstimator = FareEstimator;
}
