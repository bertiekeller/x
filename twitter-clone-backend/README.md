# Twitter Clone Backend

This is the backend for a Twitter clone application.

## Setup

1.  Install dependencies:

    ```
    npm install
    ```
2.  Configure environment variables:

    *   Create a `.env` file in the root directory.
    *   Add the following environment variables:

        ```
        MONGO_URI=<your MongoDB connection string>
        JWT_SECRET=<your JWT secret>
        PORT=5000
        ```
3.  Run the server:

    ```
    npm start
    ```

## Dependencies

*   bcryptjs
*   cors
*   dotenv
*   express
*   jsonwebtoken
*   mongoose
