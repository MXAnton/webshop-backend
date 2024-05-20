const express = require("express");
const controllers = require("../controllers");
const router = express.Router();

router.route("/products/categories").get(controllers.getProductsCategories);

router.route("/products/:sex").get(controllers.getProductsSex);
router
  .route("/products/:sex/:categories")
  .get(controllers.getProductsSexCategories);

router.route("/best-sellers/:amount").get(controllers.getBestSellers);

router.route("/product/color/:id").get(controllers.getProductColor);
router.route("/product/:id/colors").get(controllers.getProductColors);

module.exports = router;
