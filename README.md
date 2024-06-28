# Your Shoes backend
The backend API is built using Node.js and Express. MySQL is used as database and Stripe for payment.

## 🎮 Try the website using this backend
Try the live website using this backend: [your-shoes.netlify.app](https://your-shoes.netlify.app/).

## 📚 Tech stack
- `Node.js` runs the code.
- `Express.js` creating the API that makes the frontend able to connect to the backend.
- `MySQL` database.
- `Stripe` for payment.

## 🔒 Enviroment vars
- DB_HOST="" # Ex: "localhost"
- DB_NAME=""
- DB_USER=""
- DB_PASSWORD=""
- WHITELISTED_ORIGIN=* # The domain that is allowed to access the backend, the frontend.
- PORT=4000 # The port you want to run the backend on
- NODE_ENV='development'
- WEBSITE_DOMAIN="" # Ex: "http://localhost:8080"
- STRIPE_KEY="" # Secret key to the Stripe API

## 📝 Edit the code
If you want to make changes to the backend follow these steps:
1. **Clone the repo** to you local computer.
2. **You need node and npm** installed on you computer.
3. **Install dependencies** with:
```sh
npm install
```
5. **Create env file** to store local enviorment vars for development.
6. **Run the backend** with:
```sh
npm run dev
```
7. **Edit code**
8. **Commit the changes**
9. **Push commits**
