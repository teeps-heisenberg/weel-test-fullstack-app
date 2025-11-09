const DELIVERY_TYPES = {
  IN_STORE: "IN_STORE",
  DELIVERY: "DELIVERY",
  CURBSIDE: "CURBSIDE",
};

const isFutureDate = (dateString) => {
  if (!dateString) {
    return false;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() > Date.now();
};

const sanitizeOrderData = (data, deliveryType) => {
  if (!data) {
    return {};
  }

  const sanitized = { ...data };

  if (deliveryType === DELIVERY_TYPES.IN_STORE) {
    delete sanitized.address;
    delete sanitized.curbsideDetails;
  } else if (deliveryType === DELIVERY_TYPES.DELIVERY) {
    delete sanitized.curbsideDetails;
  } else if (deliveryType === DELIVERY_TYPES.CURBSIDE) {
    delete sanitized.address;
  }

  return sanitized;
};

const validateOrderData = (data, isUpdate = false) => {
  const errors = [];

  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: [
        "Delivery type is required",
        "Delivery date is required",
      ],
    };
  }

  const deliveryTypePresent = Object.hasOwn(data, "deliveryType");
  const deliveryDatePresent = Object.hasOwn(data, "deliveryDate");
  const addressPresent = Object.hasOwn(data, "address");
  const curbsideDetailsPresent = Object.hasOwn(data, "curbsideDetails");

  if (!isUpdate || deliveryTypePresent) {
    const deliveryType = data.deliveryType;

    if (!deliveryType && deliveryType !== "") {
      errors.push("Delivery type is required");
    } else if (!Object.values(DELIVERY_TYPES).includes(deliveryType)) {
      errors.push("Delivery type must be IN_STORE, DELIVERY, or CURBSIDE");
    }
  }

  if (!isUpdate || deliveryDatePresent) {
    const deliveryDate = data.deliveryDate;

    if (!deliveryDate && deliveryDate !== "") {
      errors.push("Delivery date is required");
    } else if (Number.isNaN(new Date(deliveryDate).getTime())) {
      errors.push("Delivery date must be a valid date");
    } else if (!isFutureDate(deliveryDate)) {
      errors.push("Delivery date must be in the future");
    }
  }

  const deliveryType = data.deliveryType;

  if (!Object.values(DELIVERY_TYPES).includes(deliveryType ?? "")) {
    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: deliveryTypePresent ? errors.length === 0 : true, errors };
  }

  if (isUpdate && deliveryTypePresent) {
    if (deliveryType === DELIVERY_TYPES.DELIVERY) {
      if (
        !addressPresent ||
        typeof data.address !== "string" ||
        data.address.trim() === ""
      ) {
        errors.push("Address is required for delivery orders");
      }
    } else if (deliveryType === DELIVERY_TYPES.CURBSIDE) {
      if (
        !curbsideDetailsPresent ||
        typeof data.curbsideDetails !== "string" ||
        data.curbsideDetails.trim() === ""
      ) {
        errors.push("Curbside details are required for curbside pickup");
      }
    } else if (deliveryType === DELIVERY_TYPES.IN_STORE) {
      if (
        addressPresent &&
        data.address != null &&
        data.address !== ""
      ) {
        errors.push("Address should not be provided for in-store pickup");
      }

      if (
        curbsideDetailsPresent &&
        data.curbsideDetails != null &&
        data.curbsideDetails !== ""
      ) {
        errors.push("Curbside details should not be provided for delivery orders");
      }
    }
  }

  if (
    (!isUpdate || addressPresent) &&
    deliveryType === DELIVERY_TYPES.DELIVERY &&
    (!data.address || typeof data.address !== "string" || data.address.trim() === "")
  ) {
    errors.push("Address is required for delivery orders");
  }

  if (
    (!isUpdate || curbsideDetailsPresent) &&
    deliveryType === DELIVERY_TYPES.CURBSIDE &&
    (
      !data.curbsideDetails ||
      typeof data.curbsideDetails !== "string" ||
      data.curbsideDetails.trim() === ""
    )
  ) {
    errors.push("Curbside details are required for curbside pickup");
  }

  if (
    (!isUpdate || addressPresent) &&
    deliveryType === DELIVERY_TYPES.IN_STORE &&
    data.address != null &&
    data.address !== ""
  ) {
    errors.push("Address should not be provided for in-store pickup");
  }

  if (
    (!isUpdate || curbsideDetailsPresent) &&
    deliveryType === DELIVERY_TYPES.DELIVERY &&
    data.curbsideDetails != null &&
    data.curbsideDetails !== ""
  ) {
    errors.push("Curbside details should not be provided for delivery orders");
  }

  return errors.length === 0
    ? { valid: true }
    : { valid: false, errors };
};

export {
  DELIVERY_TYPES,
  validateOrderData,
  isFutureDate,
  sanitizeOrderData,
};

