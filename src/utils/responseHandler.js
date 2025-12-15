
export class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export const sendResponse = (res, statusCode, data, message) => {
    const response = new ApiResponse(statusCode, data, message);
    return res.status(statusCode).json(response);
};

// Specific response helpers
export const sendSuccess = (res, data, message = "Request successful") => {
    return sendResponse(res, 200, data, message);
};

export const sendCreated = (res, data, message = "Resource created successfully") => {
    return sendResponse(res, 201, data, message);
};

export const sendAccepted = (res, data, message = "Request accepted") => {
    return sendResponse(res, 202, data, message);
};

export const sendNoContent = (res, message = "No content") => {
    return sendResponse(res, 204, null, message);
};
