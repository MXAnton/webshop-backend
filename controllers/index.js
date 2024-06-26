const AppError = require("../utils/appError");
const conn = require("../services/db");

const util = require("util");
const stripe = require("stripe")(process.env.STRIPE_KEY);

exports.getProductsCategories = (req, res, next) => {
  conn.query(
    `SELECT
      p.category
    FROM
      product p
    WHERE
      p.sex != "female"
    GROUP BY category;`,
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      let categories = [data.map((item) => item.category)];

      conn.query(
        `SELECT
          p.category
        FROM
          product p
        WHERE
          p.sex != "male"
        GROUP BY category;`,
        function (err, data, fields) {
          if (err) return next(new AppError(err, 500));

          categories.push(data.map((item) => item.category));

          res.status(200).json({
            status: "success",
            length: categories.flat().length, // Retrieves length of all child arrays together
            data: categories,
          });
        }
      );
    }
  );
};

exports.getProductsFiltersBySex = (req, res, next) => {
  conn.query(
    `SELECT DISTINCT brand AS value, 'brand' AS type
        FROM product
        WHERE (sex = ? OR sex = 'unisex')
      UNION
      SELECT DISTINCT material AS value, 'material' AS type
        FROM product 
        WHERE (sex = ? OR sex = 'unisex')
      UNION
      SELECT MIN(pc.price - pc.discount) AS value, 'min_price' AS type
        FROM product p
        JOIN
          product_color pc ON pc.product_id = p.id
        WHERE (p.sex = ? OR p.sex = 'unisex')
      UNION
      SELECT MAX(pc.price - pc.discount) AS value, 'max_price' AS type
        FROM product p
        JOIN
          product_color pc ON pc.product_id = p.id
        WHERE (p.sex = ? OR p.sex = 'unisex')
      UNION
      SELECT DISTINCT pc.color AS value, 'color' AS type
        FROM product p
        JOIN
          product_color pc ON pc.product_id = p.id
        WHERE (p.sex = ? OR p.sex = 'unisex')
      UNION
      SELECT DISTINCT ps.size AS value, 'size' AS type
        FROM product p
        JOIN
          product_color pc ON pc.product_id = p.id
        JOIN
          product_size ps ON ps.color_id = pc.id
        WHERE (p.sex = ? OR p.sex = 'unisex');`,
    [
      req.params.sex,
      req.params.sex,
      req.params.sex,
      req.params.sex,
      req.params.sex,
      req.params.sex,
    ],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      const result = {
        brands: [],
        materials: [],
        minPrice: 0,
        maxPrice: 999,
        colors: [],
        sizes: [],
      };

      data.forEach((row) => {
        switch (row.type) {
          case "brand":
            result.brands.push(row.value);
            break;
          case "material":
            result.materials.push(row.value);
            break;
          case "min_price":
            result.minPrice = Math.floor(row.value);
            break;
          case "max_price":
            result.maxPrice = Math.ceil(row.value);
            break;
          case "color":
            result.colors.push(row.value);
            break;
          case "size":
            result.sizes.push(row.value);
            break;
        }
      });

      res.status(200).json({
        status: "success",
        length: data.length,
        data: result,
      });
    }
  );
};
exports.getSizesByIds = (req, res, next) => {
  conn.query(
    `SELECT
      ps.id,
      pc.id AS color_id,
      p.name,
      pc.price,
      pc.discount,
      ps.size,
      ps.quantity AS quantity_available
    FROM
      product_size ps
    JOIN
      product_color pc ON ps.color_id = pc.id
    JOIN
      product p ON pc.product_id = p.id
    WHERE
      ps.id in (?);`,
    [req.params.ids.split(",").map(Number)],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      // Ensure price and discount are converted to numbers
      data.forEach((item) => {
        item.price = parseFloat(item.price);
        item.discount = parseFloat(item.discount);
      });

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    }
  );
};

exports.getProductColor = (req, res, next) => {
  conn.query(
    `SELECT
      p.id AS product_id,
      p.name,
      p.brand,
      p.sex,
      p.category,
      p.material,
      pc.price,
      pc.discount,
      pc.images,
      pc.color,
      JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', ps.id,
            'size', ps.size,
            'quantity', ps.quantity
        )
      ) AS sizes
    FROM
      product_color pc
    JOIN
      product p ON pc.product_id = p.id
    JOIN
      product_size ps ON pc.id = ps.color_id
    WHERE
      pc.id = ?
    GROUP BY
      p.id;`,
    [req.params.id],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data[0],
      });
    }
  );
};
exports.getProductColors = (req, res, next) => {
  conn.query(
    `SELECT
      pc.id,
      pc.color
    FROM
      product_color pc
    WHERE
      pc.product_id = ?;`,
    [req.params.id],
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    }
  );
};

exports.getProductsSex = (req, res, next) => {
  let query = `SELECT
                pc.id,
                p.name,
                pc.price,
                pc.discount
              FROM
                product_color pc
              JOIN
                product p ON pc.product_id = p.id
              JOIN
                product_size ps ON pc.id = ps.color_id
              WHERE (p.sex = ? OR p.sex = 'unisex')`;
  let values = [req.params.sex];

  if (req.query.categories != null) {
    query += " AND p.category IN (?)";
    values.push(req.query.categories);
  }
  if (req.query.brands != null) {
    query += " AND p.brand IN (?)";
    values.push(req.query.brands);
  }
  if (req.query.minPrice != null) {
    query += " AND pc.price - pc.discount >= ?";
    values.push(req.query.minPrice);
  }
  if (req.query.maxPrice != null) {
    query += " AND pc.price - pc.discount <= ?";
    values.push(req.query.maxPrice);
  }
  if (req.query.colors != null) {
    query += " AND pc.color IN (?)";
    values.push(req.query.colors);
  }
  if (req.query.materials != null) {
    query += " AND p.material IN (?)";
    values.push(req.query.materials);
  }
  if (req.query.onSale == "true") {
    query += " AND pc.discount > 0";
  } else if (req.query.onSale == "false") {
    query += " AND pc.discount = 0";
  }

  query += " GROUP BY pc.id, p.name";

  if (req.query.sizes != null) {
    query += " HAVING JSON_OVERLAPS(JSON_ARRAYAGG(ps.size), JSON_ARRAY(?))";

    // Convert to array of integers
    const intArray = req.query.sizes.map(Number);
    values.push(intArray);
  }

  switch (req.query.sorting) {
    case "lowest-price":
      query += " ORDER BY pc.price - pc.discount";
      break;
    case "highest-price":
      query += " ORDER BY pc.price - pc.discount DESC";
      break;
    case "a-z":
      query += " ORDER BY p.name";
      break;
    case "z-a":
      query += " ORDER BY p.name DESC";
      break;
  }
  query += " LIMIT 25;";
  conn.query(query, values, function (err, data, fields) {
    if (err) return next(new AppError(err, 500));

    res.status(200).json({
      status: "success",
      length: data?.length,
      data: data,
    });
  });
};

exports.getBestSellers = (req, res, next) => {
  conn.query(
    `SELECT
      pc.id,
      p.name,
      pc.price,
      pc.discount
    FROM
      product_color pc
    JOIN
      product p ON pc.product_id = p.id
    LIMIT ${req.params.amount};`,
    function (err, data, fields) {
      if (err) return next(new AppError(err, 500));

      res.status(200).json({
        status: "success",
        length: data?.length,
        data: data,
      });
    }
  );
};

exports.createCheckoutSession = async (req, res, next) => {
  const products = JSON.parse(req.body.products);
  if (products == null || products.length === 0) {
    return next(new AppError("No products to checkout", 404));
  }

  const productsExtrasRes = await getCheckoutProductsExtras(
    products.map((_item) => _item.id)
  );
  if (productsExtrasRes == null) {
    return next(new AppError("Didn't find products to checkout", 404));
  }

  // Merge arrays based on 'id' property and construct price_data objects
  const lineItems = productsExtrasRes.map((product1) => {
    const product2 = products.find((product2) => product2.id === product1.id);
    return {
      price_data: {
        currency: "eur",
        unit_amount: product1.discounted_price * 100,
        product_data: {
          name: product1.name,
          description: product1.brand,
          images: [product2.image],
        },
      },
      quantity: product2.quantity,
    };
  });

  // Create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.WEBSITE_DOMAIN}/checkout-success`,
    cancel_url: `${process.env.WEBSITE_DOMAIN}/checkout-cancel`,
  });

  // Send success status with link to checkout session
  res.status(201).json({
    status: "success",
    length: 1,
    data: session.url,
  });
};
async function getCheckoutProductsExtras(_ids) {
  // Promisify the conn.query method
  const query = util.promisify(conn.query).bind(conn);

  try {
    // Execute the query and wait for the result
    const data = await query(
      `SELECT
          ps.id,
          p.name,
          p.brand,
          pc.price - pc.discount AS discounted_price
        FROM
          product_size ps
        JOIN
          product_color pc ON ps.color_id = pc.id
        JOIN
          product p ON pc.product_id = p.id
        WHERE
          ps.id in (?);`,
      [_ids]
    );

    return data;
  } catch (err) {
    // Handle any errors that occur during the query
    throw err;
  }
}

/*
exports.createMember = (req, res, next) => {
  if (!req.body) return next(new AppError("No form data found", 404));
  const personNumRes = isPersonNumValid(req.body.personnummer);
  if (personNumRes !== true) {
    return next(new AppError(personNumRes, 400));
  }
  const namesRes = isNamesValid(req.body.first_name, req.body.last_name);
  if (namesRes !== true) {
    return next(new AppError(namesRes, 400));
  }

  conn.query(
    "INSERT INTO member (personnummer, first_name, last_name, end_date) VALUES(?, ?, ?, ?)",
    [
      req.body.personnummer,
      req.body.first_name,
      req.body.last_name,
      req.body.end_date,
    ],
    function (err, data, fields) {
      if (err) {
        if (err.sqlMessage?.includes("Duplicate entry")) {
          return next(new AppError("Personnummret är redan medlem.", 409));
        }
        return next(new AppError(err, 500));
      }

      uploadMemberlist();

      res.status(201).json({
        status: "success",
        message: "member created!",
      });
    }
  );
};

exports.updateMember = (req, res, next) => {
  if (!req.params.personnummer) {
    return next(new AppError("No member personnummer found", 404));
  }
  const namesRes = isNamesValid(req.body.first_name, req.body.last_name);
  if (namesRes !== true) {
    return next(new AppError(namesRes, 400));
  }

  conn.query(
    "UPDATE member SET first_name=?, last_name=?, end_date=? WHERE personnummer=?",
    [
      req.body.first_name,
      req.body.last_name,
      req.body.end_date,
      req.params.personnummer,
    ],
    function (err, data, fields) {
      if (err) {
        if (err.sqlMessage?.includes("Duplicate entry")) {
          return next(new AppError("Personnummret är redan medlem.", 409));
        }
        return next(new AppError(err, 500));
      }

      uploadMemberlist();

      res.status(201).json({
        status: "success",
        message: "member updated!",
      });
    }
  );
};

exports.deleteMember = (req, res, next) => {
  if (!req.params.personnummer) {
    return next(new AppError("No member personnummer found", 404));
  }
  conn.query(
    "DELETE FROM member WHERE personnummer=?",
    [req.params.personnummer],
    function (err, fields) {
      if (err) return next(new AppError(err, 500));

      uploadMemberlist();

      res.status(204).json({
        status: "success",
        message: "member deleted!",
      });
    }
  );
};
*/
