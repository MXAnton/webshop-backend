const express = require("express");
const controllers = require("../controllers");
const router = express.Router();

router.route("/products/categories").get(controllers.getProductsCategories);

router
  .route("/products/sex/:sex/filters")
  .get(controllers.getProductsFiltersBySex);

router.route("/products/sex/:sex").get(controllers.getProductsSex);

router.route("/best-sellers/:amount").get(controllers.getBestSellers);

router.route("/product/color/:id").get(controllers.getProductColor);
router.route("/product/:id/colors").get(controllers.getProductColors);

router.route("/sizes/:ids").get(controllers.getSizesByIds);

router
  .route("/create-checkout-session")
  .post(controllers.createCheckoutSession);

module.exports = router;
