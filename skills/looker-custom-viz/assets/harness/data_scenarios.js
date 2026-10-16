// harness/data_scenarios.js
window.scenarios = {
  "empty_results": {
    "config": {},
    "data": [],
    "queryResponse": {
      "fields": {
        "dimensions": [
          {
            "name": "transactions.category",
            "label": "Category",
            "type": "string"
          }
        ],
        "measures": [
          {
            "name": "transactions.total_revenue",
            "label": "Total Revenue",
            "type": "number"
          }
        ]
      }
    }
  },
  "category_value": {
    "config": {},
    "data": [
      {
        "transactions.category": {
          "value": "Apparel",
          "links": [
            {
              "label": "Search Apparel",
              "url": "https://google.com?q=Apparel"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 20000000,
          "rendered": "$20M"
        }
      },
      {
        "transactions.category": {
          "value": "Electronics",
          "links": [
            {
              "label": "Search Electronics",
              "url": "https://google.com?q=Electronics"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 19000000,
          "rendered": "$19M"
        }
      },
      {
        "transactions.category": {
          "value": "Home",
          "links": [
            {
              "label": "Search Home",
              "url": "https://google.com?q=Home"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 18000000,
          "rendered": "$18M"
        }
      },
      {
        "transactions.category": {
          "value": "Outdoor",
          "links": [
            {
              "label": "Search Outdoor",
              "url": "https://google.com?q=Outdoor"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 17000000,
          "rendered": "$17M"
        }
      },
      {
        "transactions.category": {
          "value": "Automotive",
          "links": [
            {
              "label": "Search Automotive",
              "url": "https://google.com?q=Automotive"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 16000000,
          "rendered": "$16M"
        }
      },
      {
        "transactions.category": {
          "value": "Beauty",
          "links": [
            {
              "label": "Search Beauty",
              "url": "https://google.com?q=Beauty"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 15000000,
          "rendered": "$15M"
        }
      },
      {
        "transactions.category": {
          "value": "Books",
          "links": [
            {
              "label": "Search Books",
              "url": "https://google.com?q=Books"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 14000000,
          "rendered": "$14M"
        }
      },
      {
        "transactions.category": {
          "value": "Sports",
          "links": [
            {
              "label": "Search Sports",
              "url": "https://google.com?q=Sports"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 13000000,
          "rendered": "$13M"
        }
      },
      {
        "transactions.category": {
          "value": "Toys",
          "links": [
            {
              "label": "Search Toys",
              "url": "https://google.com?q=Toys"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 12000000,
          "rendered": "$12M"
        }
      },
      {
        "transactions.category": {
          "value": "Health",
          "links": [
            {
              "label": "Search Health",
              "url": "https://google.com?q=Health"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 11000000,
          "rendered": "$11M"
        }
      },
      {
        "transactions.category": {
          "value": "Grocery",
          "links": [
            {
              "label": "Search Grocery",
              "url": "https://google.com?q=Grocery"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 10000000,
          "rendered": "$10M"
        }
      },
      {
        "transactions.category": {
          "value": "Garden",
          "links": [
            {
              "label": "Search Garden",
              "url": "https://google.com?q=Garden"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 9000000,
          "rendered": "$9M"
        }
      },
      {
        "transactions.category": {
          "value": "Pet Supplies",
          "links": [
            {
              "label": "Search Pet Supplies",
              "url": "https://google.com?q=Pet Supplies"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 8000000,
          "rendered": "$8M"
        }
      },
      {
        "transactions.category": {
          "value": "Office",
          "links": [
            {
              "label": "Search Office",
              "url": "https://google.com?q=Office"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 7000000,
          "rendered": "$7M"
        }
      },
      {
        "transactions.category": {
          "value": "Tools",
          "links": [
            {
              "label": "Search Tools",
              "url": "https://google.com?q=Tools"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 6000000,
          "rendered": "$6M"
        }
      },
      {
        "transactions.category": {
          "value": "Music",
          "links": [
            {
              "label": "Search Music",
              "url": "https://google.com?q=Music"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 5000000,
          "rendered": "$5M"
        }
      },
      {
        "transactions.category": {
          "value": "Movies",
          "links": [
            {
              "label": "Search Movies",
              "url": "https://google.com?q=Movies"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 4000000,
          "rendered": "$4M"
        }
      },
      {
        "transactions.category": {
          "value": "Software",
          "links": [
            {
              "label": "Search Software",
              "url": "https://google.com?q=Software"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 3000000,
          "rendered": "$3M"
        }
      },
      {
        "transactions.category": {
          "value": "Baby",
          "links": [
            {
              "label": "Search Baby",
              "url": "https://google.com?q=Baby"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 2000000,
          "rendered": "$2M"
        }
      },
      {
        "transactions.category": {
          "value": "Jewelry",
          "links": [
            {
              "label": "Search Jewelry",
              "url": "https://google.com?q=Jewelry"
            }
          ]
        },
        "transactions.total_revenue": {
          "value": 1000000,
          "rendered": "$1M"
        }
      }
    ],
    "queryResponse": {
      "fields": {
        "dimensions": [
          {
            "name": "transactions.category",
            "label": "Category",
            "type": "string"
          }
        ],
        "measures": [
          {
            "name": "transactions.total_revenue",
            "label": "Total Revenue",
            "type": "number"
          }
        ]
      }
    }
  },
  "multi_series": {
    "config": {},
    "data": [
      {
        "products.category": {
          "value": "Apparel",
          "links": [
            {
              "label": "Google Search: Apparel",
              "url": "https://google.com/search?q=Apparel"
            }
          ]
        },
        "orders.count": {
          "value": 969,
          "rendered": "969",
          "links": [
            {
              "label": "Drill orders for Apparel",
              "url": "/explore/orders?category=Apparel"
            }
          ]
        },
        "orders.total_amount": {
          "value": 43899,
          "rendered": "$43,899.00",
          "html": "<span style='color: green;'>$43,899.00</span>",
          "links": [
            {
              "label": "Drill sales for Apparel",
              "url": "/explore/sales?category=Apparel"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Electronics",
          "links": [
            {
              "label": "Google Search: Electronics",
              "url": "https://google.com/search?q=Electronics"
            }
          ]
        },
        "orders.count": {
          "value": 1162,
          "rendered": "1,162",
          "links": [
            {
              "label": "Drill orders for Electronics",
              "url": "/explore/orders?category=Electronics"
            }
          ]
        },
        "orders.total_amount": {
          "value": 52408,
          "rendered": "$52,408.00",
          "html": "<span style='color: green;'>$52,408.00</span>",
          "links": [
            {
              "label": "Drill sales for Electronics",
              "url": "/explore/sales?category=Electronics"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Home",
          "links": [
            {
              "label": "Google Search: Home",
              "url": "https://google.com/search?q=Home"
            }
          ]
        },
        "orders.count": {
          "value": 1345,
          "rendered": "1,345",
          "links": [
            {
              "label": "Drill orders for Home",
              "url": "/explore/orders?category=Home"
            }
          ]
        },
        "orders.total_amount": {
          "value": 60705,
          "rendered": "$60,705.00",
          "html": "<span style='color: green;'>$60,705.00</span>",
          "links": [
            {
              "label": "Drill sales for Home",
              "url": "/explore/sales?category=Home"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Outdoor",
          "links": [
            {
              "label": "Google Search: Outdoor",
              "url": "https://google.com/search?q=Outdoor"
            }
          ]
        },
        "orders.count": {
          "value": 1431,
          "rendered": "1,431",
          "links": [
            {
              "label": "Drill orders for Outdoor",
              "url": "/explore/orders?category=Outdoor"
            }
          ]
        },
        "orders.total_amount": {
          "value": 64751,
          "rendered": "$64,751.00",
          "html": "<span style='color: green;'>$64,751.00</span>",
          "links": [
            {
              "label": "Drill sales for Outdoor",
              "url": "/explore/sales?category=Outdoor"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Automotive",
          "links": [
            {
              "label": "Google Search: Automotive",
              "url": "https://google.com/search?q=Automotive"
            }
          ]
        },
        "orders.count": {
          "value": 1575,
          "rendered": "1,575",
          "links": [
            {
              "label": "Drill orders for Automotive",
              "url": "/explore/orders?category=Automotive"
            }
          ]
        },
        "orders.total_amount": {
          "value": 70800,
          "rendered": "$70,800.00",
          "html": "<span style='color: green;'>$70,800.00</span>",
          "links": [
            {
              "label": "Drill sales for Automotive",
              "url": "/explore/sales?category=Automotive"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Beauty",
          "links": [
            {
              "label": "Google Search: Beauty",
              "url": "https://google.com/search?q=Beauty"
            }
          ]
        },
        "orders.count": {
          "value": 1708,
          "rendered": "1,708",
          "links": [
            {
              "label": "Drill orders for Beauty",
              "url": "/explore/orders?category=Beauty"
            }
          ]
        },
        "orders.total_amount": {
          "value": 77245,
          "rendered": "$77,245.00",
          "html": "<span style='color: green;'>$77,245.00</span>",
          "links": [
            {
              "label": "Drill sales for Beauty",
              "url": "/explore/sales?category=Beauty"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Books",
          "links": [
            {
              "label": "Google Search: Books",
              "url": "https://google.com/search?q=Books"
            }
          ]
        },
        "orders.count": {
          "value": 1869,
          "rendered": "1,869",
          "links": [
            {
              "label": "Drill orders for Books",
              "url": "/explore/orders?category=Books"
            }
          ]
        },
        "orders.total_amount": {
          "value": 84252,
          "rendered": "$84,252.00",
          "html": "<span style='color: green;'>$84,252.00</span>",
          "links": [
            {
              "label": "Drill sales for Books",
              "url": "/explore/sales?category=Books"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Sports",
          "links": [
            {
              "label": "Google Search: Sports",
              "url": "https://google.com/search?q=Sports"
            }
          ]
        },
        "orders.count": {
          "value": 2043,
          "rendered": "2,043",
          "links": [
            {
              "label": "Drill orders for Sports",
              "url": "/explore/orders?category=Sports"
            }
          ]
        },
        "orders.total_amount": {
          "value": 92087,
          "rendered": "$92,087.00",
          "html": "<span style='color: green;'>$92,087.00</span>",
          "links": [
            {
              "label": "Drill sales for Sports",
              "url": "/explore/sales?category=Sports"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Toys",
          "links": [
            {
              "label": "Google Search: Toys",
              "url": "https://google.com/search?q=Toys"
            }
          ]
        },
        "orders.count": {
          "value": 2163,
          "rendered": "2,163",
          "links": [
            {
              "label": "Drill orders for Toys",
              "url": "/explore/orders?category=Toys"
            }
          ]
        },
        "orders.total_amount": {
          "value": 97416,
          "rendered": "$97,416.00",
          "html": "<span style='color: green;'>$97,416.00</span>",
          "links": [
            {
              "label": "Drill sales for Toys",
              "url": "/explore/sales?category=Toys"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Health",
          "links": [
            {
              "label": "Google Search: Health",
              "url": "https://google.com/search?q=Health"
            }
          ]
        },
        "orders.count": {
          "value": 2305,
          "rendered": "2,305",
          "links": [
            {
              "label": "Drill orders for Health",
              "url": "/explore/orders?category=Health"
            }
          ]
        },
        "orders.total_amount": {
          "value": 103579,
          "rendered": "$103,579.00",
          "html": "<span style='color: green;'>$103,579.00</span>",
          "links": [
            {
              "label": "Drill sales for Health",
              "url": "/explore/sales?category=Health"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Grocery",
          "links": [
            {
              "label": "Google Search: Grocery",
              "url": "https://google.com/search?q=Grocery"
            }
          ]
        },
        "orders.count": {
          "value": 2508,
          "rendered": "2,508",
          "links": [
            {
              "label": "Drill orders for Grocery",
              "url": "/explore/orders?category=Grocery"
            }
          ]
        },
        "orders.total_amount": {
          "value": 113257,
          "rendered": "$113,257.00",
          "html": "<span style='color: green;'>$113,257.00</span>",
          "links": [
            {
              "label": "Drill sales for Grocery",
              "url": "/explore/sales?category=Grocery"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Garden",
          "links": [
            {
              "label": "Google Search: Garden",
              "url": "https://google.com/search?q=Garden"
            }
          ]
        },
        "orders.count": {
          "value": 2647,
          "rendered": "2,647",
          "links": [
            {
              "label": "Drill orders for Garden",
              "url": "/explore/orders?category=Garden"
            }
          ]
        },
        "orders.total_amount": {
          "value": 119433,
          "rendered": "$119,433.00",
          "html": "<span style='color: green;'>$119,433.00</span>",
          "links": [
            {
              "label": "Drill sales for Garden",
              "url": "/explore/sales?category=Garden"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Pet Supplies",
          "links": [
            {
              "label": "Google Search: Pet Supplies",
              "url": "https://google.com/search?q=Pet Supplies"
            }
          ]
        },
        "orders.count": {
          "value": 2805,
          "rendered": "2,805",
          "links": [
            {
              "label": "Drill orders for Pet Supplies",
              "url": "/explore/orders?category=Pet Supplies"
            }
          ]
        },
        "orders.total_amount": {
          "value": 125965,
          "rendered": "$125,965.00",
          "html": "<span style='color: green;'>$125,965.00</span>",
          "links": [
            {
              "label": "Drill sales for Pet Supplies",
              "url": "/explore/sales?category=Pet Supplies"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Office",
          "links": [
            {
              "label": "Google Search: Office",
              "url": "https://google.com/search?q=Office"
            }
          ]
        },
        "orders.count": {
          "value": 2928,
          "rendered": "2,928",
          "links": [
            {
              "label": "Drill orders for Office",
              "url": "/explore/orders?category=Office"
            }
          ]
        },
        "orders.total_amount": {
          "value": 131632,
          "rendered": "$131,632.00",
          "html": "<span style='color: green;'>$131,632.00</span>",
          "links": [
            {
              "label": "Drill sales for Office",
              "url": "/explore/sales?category=Office"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Tools",
          "links": [
            {
              "label": "Google Search: Tools",
              "url": "https://google.com/search?q=Tools"
            }
          ]
        },
        "orders.count": {
          "value": 3103,
          "rendered": "3,103",
          "links": [
            {
              "label": "Drill orders for Tools",
              "url": "/explore/orders?category=Tools"
            }
          ]
        },
        "orders.total_amount": {
          "value": 139328,
          "rendered": "$139,328.00",
          "html": "<span style='color: green;'>$139,328.00</span>",
          "links": [
            {
              "label": "Drill sales for Tools",
              "url": "/explore/sales?category=Tools"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Music",
          "links": [
            {
              "label": "Google Search: Music",
              "url": "https://google.com/search?q=Music"
            }
          ]
        },
        "orders.count": {
          "value": 3254,
          "rendered": "3,254",
          "links": [
            {
              "label": "Drill orders for Music",
              "url": "/explore/orders?category=Music"
            }
          ]
        },
        "orders.total_amount": {
          "value": 146921,
          "rendered": "$146,921.00",
          "html": "<span style='color: green;'>$146,921.00</span>",
          "links": [
            {
              "label": "Drill sales for Music",
              "url": "/explore/sales?category=Music"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Movies",
          "links": [
            {
              "label": "Google Search: Movies",
              "url": "https://google.com/search?q=Movies"
            }
          ]
        },
        "orders.count": {
          "value": 3393,
          "rendered": "3,393",
          "links": [
            {
              "label": "Drill orders for Movies",
              "url": "/explore/orders?category=Movies"
            }
          ]
        },
        "orders.total_amount": {
          "value": 152840,
          "rendered": "$152,840.00",
          "html": "<span style='color: green;'>$152,840.00</span>",
          "links": [
            {
              "label": "Drill sales for Movies",
              "url": "/explore/sales?category=Movies"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Software",
          "links": [
            {
              "label": "Google Search: Software",
              "url": "https://google.com/search?q=Software"
            }
          ]
        },
        "orders.count": {
          "value": 3564,
          "rendered": "3,564",
          "links": [
            {
              "label": "Drill orders for Software",
              "url": "/explore/orders?category=Software"
            }
          ]
        },
        "orders.total_amount": {
          "value": 160492,
          "rendered": "$160,492.00",
          "html": "<span style='color: green;'>$160,492.00</span>",
          "links": [
            {
              "label": "Drill sales for Software",
              "url": "/explore/sales?category=Software"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Baby",
          "links": [
            {
              "label": "Google Search: Baby",
              "url": "https://google.com/search?q=Baby"
            }
          ]
        },
        "orders.count": {
          "value": 3720,
          "rendered": "3,720",
          "links": [
            {
              "label": "Drill orders for Baby",
              "url": "/explore/orders?category=Baby"
            }
          ]
        },
        "orders.total_amount": {
          "value": 167849,
          "rendered": "$167,849.00",
          "html": "<span style='color: green;'>$167,849.00</span>",
          "links": [
            {
              "label": "Drill sales for Baby",
              "url": "/explore/sales?category=Baby"
            }
          ]
        }
      },
      {
        "products.category": {
          "value": "Jewelry",
          "links": [
            {
              "label": "Google Search: Jewelry",
              "url": "https://google.com/search?q=Jewelry"
            }
          ]
        },
        "orders.count": {
          "value": 3875,
          "rendered": "3,875",
          "links": [
            {
              "label": "Drill orders for Jewelry",
              "url": "/explore/orders?category=Jewelry"
            }
          ]
        },
        "orders.total_amount": {
          "value": 174217,
          "rendered": "$174,217.00",
          "html": "<span style='color: green;'>$174,217.00</span>",
          "links": [
            {
              "label": "Drill sales for Jewelry",
              "url": "/explore/sales?category=Jewelry"
            }
          ]
        }
      }
    ],
    "queryResponse": {
      "fields": {
        "dimensions": [
          {
            "name": "products.category",
            "label": "Category",
            "type": "string"
          }
        ],
        "measures": [
          {
            "name": "orders.count",
            "label": "Orders Count",
            "type": "number",
            "value_format": "#,##0"
          },
          {
            "name": "orders.total_amount",
            "label": "Total Sales",
            "type": "number",
            "value_format": "0,##0.00"
          }
        ]
      }
    }
  },
  "stacked_grouped": {
    "config": {},
    "data": [
      {
        "users.state": {
          "value": "California",
          "links": [
            {
              "label": "Dashboard for California",
              "url": "/dashboards/states?state=California"
            }
          ]
        },
        "products.category": {
          "value": "Apparel",
          "links": [
            {
              "label": "Search Apparel",
              "url": "https://google.com?q=Apparel"
            }
          ]
        },
        "orders.count": {
          "value": 317,
          "rendered": "317",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=California&category=Apparel"
            }
          ]
        },
        "orders.total_amount": {
          "value": 18130,
          "rendered": "$18,130.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=California&category=Apparel"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "California",
          "links": [
            {
              "label": "Dashboard for California",
              "url": "/dashboards/states?state=California"
            }
          ]
        },
        "products.category": {
          "value": "Electronics",
          "links": [
            {
              "label": "Search Electronics",
              "url": "https://google.com?q=Electronics"
            }
          ]
        },
        "orders.count": {
          "value": 325,
          "rendered": "325",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=California&category=Electronics"
            }
          ]
        },
        "orders.total_amount": {
          "value": 19401,
          "rendered": "$19,401.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=California&category=Electronics"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "California",
          "links": [
            {
              "label": "Dashboard for California",
              "url": "/dashboards/states?state=California"
            }
          ]
        },
        "products.category": {
          "value": "Home",
          "links": [
            {
              "label": "Search Home",
              "url": "https://google.com?q=Home"
            }
          ]
        },
        "orders.count": {
          "value": 690,
          "rendered": "690",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=California&category=Home"
            }
          ]
        },
        "orders.total_amount": {
          "value": 42368,
          "rendered": "$42,368.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=California&category=Home"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "California",
          "links": [
            {
              "label": "Dashboard for California",
              "url": "/dashboards/states?state=California"
            }
          ]
        },
        "products.category": {
          "value": "Outdoor",
          "links": [
            {
              "label": "Search Outdoor",
              "url": "https://google.com?q=Outdoor"
            }
          ]
        },
        "orders.count": {
          "value": 572,
          "rendered": "572",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=California&category=Outdoor"
            }
          ]
        },
        "orders.total_amount": {
          "value": 34824,
          "rendered": "$34,824.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=California&category=Outdoor"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "New York",
          "links": [
            {
              "label": "Dashboard for New York",
              "url": "/dashboards/states?state=New York"
            }
          ]
        },
        "products.category": {
          "value": "Apparel",
          "links": [
            {
              "label": "Search Apparel",
              "url": "https://google.com?q=Apparel"
            }
          ]
        },
        "orders.count": {
          "value": 469,
          "rendered": "469",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=New York&category=Apparel"
            }
          ]
        },
        "orders.total_amount": {
          "value": 27806,
          "rendered": "$27,806.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=New York&category=Apparel"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "New York",
          "links": [
            {
              "label": "Dashboard for New York",
              "url": "/dashboards/states?state=New York"
            }
          ]
        },
        "products.category": {
          "value": "Electronics",
          "links": [
            {
              "label": "Search Electronics",
              "url": "https://google.com?q=Electronics"
            }
          ]
        },
        "orders.count": {
          "value": 602,
          "rendered": "602",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=New York&category=Electronics"
            }
          ]
        },
        "orders.total_amount": {
          "value": 35924,
          "rendered": "$35,924.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=New York&category=Electronics"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "New York",
          "links": [
            {
              "label": "Dashboard for New York",
              "url": "/dashboards/states?state=New York"
            }
          ]
        },
        "products.category": {
          "value": "Home",
          "links": [
            {
              "label": "Search Home",
              "url": "https://google.com?q=Home"
            }
          ]
        },
        "orders.count": {
          "value": 346,
          "rendered": "346",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=New York&category=Home"
            }
          ]
        },
        "orders.total_amount": {
          "value": 20892,
          "rendered": "$20,892.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=New York&category=Home"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "New York",
          "links": [
            {
              "label": "Dashboard for New York",
              "url": "/dashboards/states?state=New York"
            }
          ]
        },
        "products.category": {
          "value": "Outdoor",
          "links": [
            {
              "label": "Search Outdoor",
              "url": "https://google.com?q=Outdoor"
            }
          ]
        },
        "orders.count": {
          "value": 426,
          "rendered": "426",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=New York&category=Outdoor"
            }
          ]
        },
        "orders.total_amount": {
          "value": 24663,
          "rendered": "$24,663.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=New York&category=Outdoor"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Texas",
          "links": [
            {
              "label": "Dashboard for Texas",
              "url": "/dashboards/states?state=Texas"
            }
          ]
        },
        "products.category": {
          "value": "Apparel",
          "links": [
            {
              "label": "Search Apparel",
              "url": "https://google.com?q=Apparel"
            }
          ]
        },
        "orders.count": {
          "value": 683,
          "rendered": "683",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Texas&category=Apparel"
            }
          ]
        },
        "orders.total_amount": {
          "value": 40416,
          "rendered": "$40,416.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Texas&category=Apparel"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Texas",
          "links": [
            {
              "label": "Dashboard for Texas",
              "url": "/dashboards/states?state=Texas"
            }
          ]
        },
        "products.category": {
          "value": "Electronics",
          "links": [
            {
              "label": "Search Electronics",
              "url": "https://google.com?q=Electronics"
            }
          ]
        },
        "orders.count": {
          "value": 448,
          "rendered": "448",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Texas&category=Electronics"
            }
          ]
        },
        "orders.total_amount": {
          "value": 27501,
          "rendered": "$27,501.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Texas&category=Electronics"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Texas",
          "links": [
            {
              "label": "Dashboard for Texas",
              "url": "/dashboards/states?state=Texas"
            }
          ]
        },
        "products.category": {
          "value": "Home",
          "links": [
            {
              "label": "Search Home",
              "url": "https://google.com?q=Home"
            }
          ]
        },
        "orders.count": {
          "value": 515,
          "rendered": "515",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Texas&category=Home"
            }
          ]
        },
        "orders.total_amount": {
          "value": 31781,
          "rendered": "$31,781.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Texas&category=Home"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Texas",
          "links": [
            {
              "label": "Dashboard for Texas",
              "url": "/dashboards/states?state=Texas"
            }
          ]
        },
        "products.category": {
          "value": "Outdoor",
          "links": [
            {
              "label": "Search Outdoor",
              "url": "https://google.com?q=Outdoor"
            }
          ]
        },
        "orders.count": {
          "value": 433,
          "rendered": "433",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Texas&category=Outdoor"
            }
          ]
        },
        "orders.total_amount": {
          "value": 25651,
          "rendered": "$25,651.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Texas&category=Outdoor"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Florida",
          "links": [
            {
              "label": "Dashboard for Florida",
              "url": "/dashboards/states?state=Florida"
            }
          ]
        },
        "products.category": {
          "value": "Apparel",
          "links": [
            {
              "label": "Search Apparel",
              "url": "https://google.com?q=Apparel"
            }
          ]
        },
        "orders.count": {
          "value": 342,
          "rendered": "342",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Florida&category=Apparel"
            }
          ]
        },
        "orders.total_amount": {
          "value": 21063,
          "rendered": "$21,063.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Florida&category=Apparel"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Florida",
          "links": [
            {
              "label": "Dashboard for Florida",
              "url": "/dashboards/states?state=Florida"
            }
          ]
        },
        "products.category": {
          "value": "Electronics",
          "links": [
            {
              "label": "Search Electronics",
              "url": "https://google.com?q=Electronics"
            }
          ]
        },
        "orders.count": {
          "value": 462,
          "rendered": "462",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Florida&category=Electronics"
            }
          ]
        },
        "orders.total_amount": {
          "value": 27724,
          "rendered": "$27,724.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Florida&category=Electronics"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Florida",
          "links": [
            {
              "label": "Dashboard for Florida",
              "url": "/dashboards/states?state=Florida"
            }
          ]
        },
        "products.category": {
          "value": "Home",
          "links": [
            {
              "label": "Search Home",
              "url": "https://google.com?q=Home"
            }
          ]
        },
        "orders.count": {
          "value": 250,
          "rendered": "250",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Florida&category=Home"
            }
          ]
        },
        "orders.total_amount": {
          "value": 14515,
          "rendered": "$14,515.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Florida&category=Home"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Florida",
          "links": [
            {
              "label": "Dashboard for Florida",
              "url": "/dashboards/states?state=Florida"
            }
          ]
        },
        "products.category": {
          "value": "Outdoor",
          "links": [
            {
              "label": "Search Outdoor",
              "url": "https://google.com?q=Outdoor"
            }
          ]
        },
        "orders.count": {
          "value": 339,
          "rendered": "339",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Florida&category=Outdoor"
            }
          ]
        },
        "orders.total_amount": {
          "value": 20336,
          "rendered": "$20,336.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Florida&category=Outdoor"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Illinois",
          "links": [
            {
              "label": "Dashboard for Illinois",
              "url": "/dashboards/states?state=Illinois"
            }
          ]
        },
        "products.category": {
          "value": "Apparel",
          "links": [
            {
              "label": "Search Apparel",
              "url": "https://google.com?q=Apparel"
            }
          ]
        },
        "orders.count": {
          "value": 327,
          "rendered": "327",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Illinois&category=Apparel"
            }
          ]
        },
        "orders.total_amount": {
          "value": 18882,
          "rendered": "$18,882.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Illinois&category=Apparel"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Illinois",
          "links": [
            {
              "label": "Dashboard for Illinois",
              "url": "/dashboards/states?state=Illinois"
            }
          ]
        },
        "products.category": {
          "value": "Electronics",
          "links": [
            {
              "label": "Search Electronics",
              "url": "https://google.com?q=Electronics"
            }
          ]
        },
        "orders.count": {
          "value": 251,
          "rendered": "251",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Illinois&category=Electronics"
            }
          ]
        },
        "orders.total_amount": {
          "value": 14423,
          "rendered": "$14,423.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Illinois&category=Electronics"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Illinois",
          "links": [
            {
              "label": "Dashboard for Illinois",
              "url": "/dashboards/states?state=Illinois"
            }
          ]
        },
        "products.category": {
          "value": "Home",
          "links": [
            {
              "label": "Search Home",
              "url": "https://google.com?q=Home"
            }
          ]
        },
        "orders.count": {
          "value": 679,
          "rendered": "679",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Illinois&category=Home"
            }
          ]
        },
        "orders.total_amount": {
          "value": 40333,
          "rendered": "$40,333.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Illinois&category=Home"
            }
          ]
        }
      },
      {
        "users.state": {
          "value": "Illinois",
          "links": [
            {
              "label": "Dashboard for Illinois",
              "url": "/dashboards/states?state=Illinois"
            }
          ]
        },
        "products.category": {
          "value": "Outdoor",
          "links": [
            {
              "label": "Search Outdoor",
              "url": "https://google.com?q=Outdoor"
            }
          ]
        },
        "orders.count": {
          "value": 464,
          "rendered": "464",
          "links": [
            {
              "label": "Drill orders",
              "url": "/explore/orders?state=Illinois&category=Outdoor"
            }
          ]
        },
        "orders.total_amount": {
          "value": 26931,
          "rendered": "$26,931.00",
          "links": [
            {
              "label": "Drill sales",
              "url": "/explore/sales?state=Illinois&category=Outdoor"
            }
          ]
        }
      }
    ],
    "queryResponse": {
      "fields": {
        "dimensions": [
          {
            "name": "users.state",
            "label": "State",
            "type": "string"
          },
          {
            "name": "products.category",
            "label": "Category",
            "type": "string"
          }
        ],
        "measures": [
          {
            "name": "orders.count",
            "label": "Orders Count",
            "type": "number",
            "value_format": "#,##0"
          },
          {
            "name": "orders.total_amount",
            "label": "Total Sales",
            "type": "number",
            "value_format": "0,##0.00"
          }
        ]
      }
    }
  },
  "time_series": {
    "config": {},
    "data": [
      {
        "orders.created_date": {
          "value": "2026-07-01",
          "rendered": "2026-07-01",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-01"
            }
          ]
        },
        "orders.count": {
          "value": 42,
          "rendered": "42",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-01&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 1279,
          "rendered": "$1,279",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-01&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-02",
          "rendered": "2026-07-02",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-02"
            }
          ]
        },
        "orders.count": {
          "value": 46,
          "rendered": "46",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-02&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 1633,
          "rendered": "$1,633",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-02&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-03",
          "rendered": "2026-07-03",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-03"
            }
          ]
        },
        "orders.count": {
          "value": 53,
          "rendered": "53",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-03&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2007,
          "rendered": "$2,007",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-03&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-04",
          "rendered": "2026-07-04",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-04"
            }
          ]
        },
        "orders.count": {
          "value": 47,
          "rendered": "47",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-04&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 1448,
          "rendered": "$1,448",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-04&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-05",
          "rendered": "2026-07-05",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-05"
            }
          ]
        },
        "orders.count": {
          "value": 52,
          "rendered": "52",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-05&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 1897,
          "rendered": "$1,897",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-05&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-06",
          "rendered": "2026-07-06",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-06"
            }
          ]
        },
        "orders.count": {
          "value": 65,
          "rendered": "65",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-06&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2249,
          "rendered": "$2,249",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-06&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-07",
          "rendered": "2026-07-07",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-07"
            }
          ]
        },
        "orders.count": {
          "value": 62,
          "rendered": "62",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-07&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2152,
          "rendered": "$2,152",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-07&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-08",
          "rendered": "2026-07-08",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-08"
            }
          ]
        },
        "orders.count": {
          "value": 56,
          "rendered": "56",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-08&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 1846,
          "rendered": "$1,846",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-08&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-09",
          "rendered": "2026-07-09",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-09"
            }
          ]
        },
        "orders.count": {
          "value": 66,
          "rendered": "66",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-09&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2137,
          "rendered": "$2,137",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-09&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-10",
          "rendered": "2026-07-10",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-10"
            }
          ]
        },
        "orders.count": {
          "value": 73,
          "rendered": "73",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-10&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2444,
          "rendered": "$2,444",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-10&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-11",
          "rendered": "2026-07-11",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-11"
            }
          ]
        },
        "orders.count": {
          "value": 72,
          "rendered": "72",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-11&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2331,
          "rendered": "$2,331",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-11&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-12",
          "rendered": "2026-07-12",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-12"
            }
          ]
        },
        "orders.count": {
          "value": 63,
          "rendered": "63",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-12&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2013,
          "rendered": "$2,013",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-12&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-13",
          "rendered": "2026-07-13",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-13"
            }
          ]
        },
        "orders.count": {
          "value": 84,
          "rendered": "84",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-13&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3051,
          "rendered": "$3,051",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-13&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-14",
          "rendered": "2026-07-14",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-14"
            }
          ]
        },
        "orders.count": {
          "value": 79,
          "rendered": "79",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-14&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2735,
          "rendered": "$2,735",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-14&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-15",
          "rendered": "2026-07-15",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-15"
            }
          ]
        },
        "orders.count": {
          "value": 81,
          "rendered": "81",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-15&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2741,
          "rendered": "$2,741",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-15&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-16",
          "rendered": "2026-07-16",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-16"
            }
          ]
        },
        "orders.count": {
          "value": 81,
          "rendered": "81",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-16&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2814,
          "rendered": "$2,814",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-16&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-17",
          "rendered": "2026-07-17",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-17"
            }
          ]
        },
        "orders.count": {
          "value": 82,
          "rendered": "82",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-17&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2795,
          "rendered": "$2,795",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-17&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-18",
          "rendered": "2026-07-18",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-18"
            }
          ]
        },
        "orders.count": {
          "value": 88,
          "rendered": "88",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-18&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3038,
          "rendered": "$3,038",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-18&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-19",
          "rendered": "2026-07-19",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-19"
            }
          ]
        },
        "orders.count": {
          "value": 77,
          "rendered": "77",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-19&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 2543,
          "rendered": "$2,543",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-19&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-20",
          "rendered": "2026-07-20",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-20"
            }
          ]
        },
        "orders.count": {
          "value": 98,
          "rendered": "98",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-20&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3581,
          "rendered": "$3,581",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-20&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-21",
          "rendered": "2026-07-21",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-21"
            }
          ]
        },
        "orders.count": {
          "value": 94,
          "rendered": "94",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-21&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3295,
          "rendered": "$3,295",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-21&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-22",
          "rendered": "2026-07-22",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-22"
            }
          ]
        },
        "orders.count": {
          "value": 90,
          "rendered": "90",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-22&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3190,
          "rendered": "$3,190",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-22&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-23",
          "rendered": "2026-07-23",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-23"
            }
          ]
        },
        "orders.count": {
          "value": 90,
          "rendered": "90",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-23&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3035,
          "rendered": "$3,035",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-23&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-24",
          "rendered": "2026-07-24",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-24"
            }
          ]
        },
        "orders.count": {
          "value": 100,
          "rendered": "100",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-24&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3430,
          "rendered": "$3,430",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-24&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-25",
          "rendered": "2026-07-25",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-25"
            }
          ]
        },
        "orders.count": {
          "value": 108,
          "rendered": "108",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-25&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3750,
          "rendered": "$3,750",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-25&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-26",
          "rendered": "2026-07-26",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-26"
            }
          ]
        },
        "orders.count": {
          "value": 105,
          "rendered": "105",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-26&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3598,
          "rendered": "$3,598",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-26&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-27",
          "rendered": "2026-07-27",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-27"
            }
          ]
        },
        "orders.count": {
          "value": 100,
          "rendered": "100",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-27&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3523,
          "rendered": "$3,523",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-27&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-28",
          "rendered": "2026-07-28",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-28"
            }
          ]
        },
        "orders.count": {
          "value": 106,
          "rendered": "106",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-28&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3897,
          "rendered": "$3,897",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-28&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-29",
          "rendered": "2026-07-29",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-29"
            }
          ]
        },
        "orders.count": {
          "value": 100,
          "rendered": "100",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-29&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3631,
          "rendered": "$3,631",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-29&fields=id,amount"
            }
          ]
        }
      },
      {
        "orders.created_date": {
          "value": "2026-07-30",
          "rendered": "2026-07-30",
          "links": [
            {
              "label": "Explore Day Details",
              "url": "/explore/orders?date=2026-07-30"
            }
          ]
        },
        "orders.count": {
          "value": 111,
          "rendered": "111",
          "links": [
            {
              "label": "Drill Day Orders",
              "url": "/explore/orders?date=2026-07-30&fields=id"
            }
          ]
        },
        "orders.total_amount": {
          "value": 3771,
          "rendered": "$3,771",
          "links": [
            {
              "label": "Drill Day Sales",
              "url": "/explore/sales?date=2026-07-30&fields=id,amount"
            }
          ]
        }
      }
    ],
    "queryResponse": {
      "fields": {
        "dimensions": [
          {
            "name": "orders.created_date",
            "label": "Created Date",
            "type": "date"
          }
        ],
        "measures": [
          {
            "name": "orders.count",
            "label": "Orders Count",
            "type": "number",
            "value_format": "#,##0"
          },
          {
            "name": "orders.total_amount",
            "label": "Total Sales",
            "type": "number",
            "value_format": "0,##0.00"
          }
        ]
      }
    }
  },
  "pivoted": {
    "config": {},
    "data": [
      {
        "users.state": {
          "value": "California",
          "rendered": "California",
          "html": "<b>California</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=California"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 377,
            "rendered": "377",
            "links": [
              {
                "label": "Drill California 2025",
                "url": "/explore/orders?state=California&year=2025"
              }
            ]
          },
          "2026": {
            "value": 510,
            "rendered": "510",
            "html": "<span style='color: green; font-weight: bold;'>510</span>",
            "links": [
              {
                "label": "Drill California 2026",
                "url": "/explore/orders?state=California&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "New York",
          "rendered": "New York",
          "html": "<b>New York</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=New York"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 386,
            "rendered": "386",
            "links": [
              {
                "label": "Drill New York 2025",
                "url": "/explore/orders?state=New York&year=2025"
              }
            ]
          },
          "2026": {
            "value": 449,
            "rendered": "449",
            "html": "<span style='color: green; font-weight: bold;'>449</span>",
            "links": [
              {
                "label": "Drill New York 2026",
                "url": "/explore/orders?state=New York&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Texas",
          "rendered": "Texas",
          "html": "<b>Texas</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Texas"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 437,
            "rendered": "437",
            "links": [
              {
                "label": "Drill Texas 2025",
                "url": "/explore/orders?state=Texas&year=2025"
              }
            ]
          },
          "2026": {
            "value": 455,
            "rendered": "455",
            "html": "<span style='color: green; font-weight: bold;'>455</span>",
            "links": [
              {
                "label": "Drill Texas 2026",
                "url": "/explore/orders?state=Texas&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Florida",
          "rendered": "Florida",
          "html": "<b>Florida</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Florida"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 688,
            "rendered": "688",
            "links": [
              {
                "label": "Drill Florida 2025",
                "url": "/explore/orders?state=Florida&year=2025"
              }
            ]
          },
          "2026": {
            "value": 808,
            "rendered": "808",
            "html": "<span style='color: green; font-weight: bold;'>808</span>",
            "links": [
              {
                "label": "Drill Florida 2026",
                "url": "/explore/orders?state=Florida&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Illinois",
          "rendered": "Illinois",
          "html": "<b>Illinois</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Illinois"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 449,
            "rendered": "449",
            "links": [
              {
                "label": "Drill Illinois 2025",
                "url": "/explore/orders?state=Illinois&year=2025"
              }
            ]
          },
          "2026": {
            "value": 494,
            "rendered": "494",
            "html": "<span style='color: green; font-weight: bold;'>494</span>",
            "links": [
              {
                "label": "Drill Illinois 2026",
                "url": "/explore/orders?state=Illinois&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Pennsylvania",
          "rendered": "Pennsylvania",
          "html": "<b>Pennsylvania</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Pennsylvania"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 596,
            "rendered": "596",
            "links": [
              {
                "label": "Drill Pennsylvania 2025",
                "url": "/explore/orders?state=Pennsylvania&year=2025"
              }
            ]
          },
          "2026": {
            "value": 677,
            "rendered": "677",
            "html": "<span style='color: green; font-weight: bold;'>677</span>",
            "links": [
              {
                "label": "Drill Pennsylvania 2026",
                "url": "/explore/orders?state=Pennsylvania&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Ohio",
          "rendered": "Ohio",
          "html": "<b>Ohio</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Ohio"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 466,
            "rendered": "466",
            "links": [
              {
                "label": "Drill Ohio 2025",
                "url": "/explore/orders?state=Ohio&year=2025"
              }
            ]
          },
          "2026": {
            "value": 573,
            "rendered": "573",
            "html": "<span style='color: green; font-weight: bold;'>573</span>",
            "links": [
              {
                "label": "Drill Ohio 2026",
                "url": "/explore/orders?state=Ohio&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Michigan",
          "rendered": "Michigan",
          "html": "<b>Michigan</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Michigan"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 356,
            "rendered": "356",
            "links": [
              {
                "label": "Drill Michigan 2025",
                "url": "/explore/orders?state=Michigan&year=2025"
              }
            ]
          },
          "2026": {
            "value": 385,
            "rendered": "385",
            "html": "<span style='color: green; font-weight: bold;'>385</span>",
            "links": [
              {
                "label": "Drill Michigan 2026",
                "url": "/explore/orders?state=Michigan&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Georgia",
          "rendered": "Georgia",
          "html": "<b>Georgia</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Georgia"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 545,
            "rendered": "545",
            "links": [
              {
                "label": "Drill Georgia 2025",
                "url": "/explore/orders?state=Georgia&year=2025"
              }
            ]
          },
          "2026": {
            "value": 585,
            "rendered": "585",
            "html": "<span style='color: green; font-weight: bold;'>585</span>",
            "links": [
              {
                "label": "Drill Georgia 2026",
                "url": "/explore/orders?state=Georgia&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "North Carolina",
          "rendered": "North Carolina",
          "html": "<b>North Carolina</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=North Carolina"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 542,
            "rendered": "542",
            "links": [
              {
                "label": "Drill North Carolina 2025",
                "url": "/explore/orders?state=North Carolina&year=2025"
              }
            ]
          },
          "2026": {
            "value": 637,
            "rendered": "637",
            "html": "<span style='color: green; font-weight: bold;'>637</span>",
            "links": [
              {
                "label": "Drill North Carolina 2026",
                "url": "/explore/orders?state=North Carolina&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "New Jersey",
          "rendered": "New Jersey",
          "html": "<b>New Jersey</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=New Jersey"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 352,
            "rendered": "352",
            "links": [
              {
                "label": "Drill New Jersey 2025",
                "url": "/explore/orders?state=New Jersey&year=2025"
              }
            ]
          },
          "2026": {
            "value": 436,
            "rendered": "436",
            "html": "<span style='color: green; font-weight: bold;'>436</span>",
            "links": [
              {
                "label": "Drill New Jersey 2026",
                "url": "/explore/orders?state=New Jersey&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Virginia",
          "rendered": "Virginia",
          "html": "<b>Virginia</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Virginia"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 490,
            "rendered": "490",
            "links": [
              {
                "label": "Drill Virginia 2025",
                "url": "/explore/orders?state=Virginia&year=2025"
              }
            ]
          },
          "2026": {
            "value": 615,
            "rendered": "615",
            "html": "<span style='color: green; font-weight: bold;'>615</span>",
            "links": [
              {
                "label": "Drill Virginia 2026",
                "url": "/explore/orders?state=Virginia&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Washington",
          "rendered": "Washington",
          "html": "<b>Washington</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Washington"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 541,
            "rendered": "541",
            "links": [
              {
                "label": "Drill Washington 2025",
                "url": "/explore/orders?state=Washington&year=2025"
              }
            ]
          },
          "2026": {
            "value": 568,
            "rendered": "568",
            "html": "<span style='color: green; font-weight: bold;'>568</span>",
            "links": [
              {
                "label": "Drill Washington 2026",
                "url": "/explore/orders?state=Washington&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Arizona",
          "rendered": "Arizona",
          "html": "<b>Arizona</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Arizona"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 398,
            "rendered": "398",
            "links": [
              {
                "label": "Drill Arizona 2025",
                "url": "/explore/orders?state=Arizona&year=2025"
              }
            ]
          },
          "2026": {
            "value": 415,
            "rendered": "415",
            "html": "<span style='color: green; font-weight: bold;'>415</span>",
            "links": [
              {
                "label": "Drill Arizona 2026",
                "url": "/explore/orders?state=Arizona&year=2026"
              }
            ]
          }
        }
      },
      {
        "users.state": {
          "value": "Massachusetts",
          "rendered": "Massachusetts",
          "html": "<b>Massachusetts</b>",
          "links": [
            {
              "label": "State Dashboard",
              "url": "/dashboards/states?state=Massachusetts"
            }
          ]
        },
        "orders.count": {
          "2025": {
            "value": 677,
            "rendered": "677",
            "links": [
              {
                "label": "Drill Massachusetts 2025",
                "url": "/explore/orders?state=Massachusetts&year=2025"
              }
            ]
          },
          "2026": {
            "value": 760,
            "rendered": "760",
            "html": "<span style='color: green; font-weight: bold;'>760</span>",
            "links": [
              {
                "label": "Drill Massachusetts 2026",
                "url": "/explore/orders?state=Massachusetts&year=2026"
              }
            ]
          }
        }
      }
    ],
    "queryResponse": {
      "fields": {
        "dimensions": [
          {
            "name": "users.state",
            "label": "State",
            "type": "string"
          }
        ],
        "measures": [
          {
            "name": "orders.count",
            "label": "Orders Count",
            "type": "number"
          }
        ],
        "pivots": [
          {
            "name": "orders.created_year",
            "label": "Created Year"
          }
        ]
      },
      "pivots": [
        {
          "key": "2025",
          "label": "2025",
          "data": {
            "orders.created_year": "2025"
          }
        },
        {
          "key": "2026",
          "label": "2026",
          "data": {
            "orders.created_year": "2026"
          }
        }
      ]
    }
  },
  "tabular_with_drills": {
    "config": {},
    "data": [
      {
        "users.id": {
          "value": 1,
          "rendered": "1",
          "links": [
            {
              "label": "User Dashboard 1",
              "url": "/dashboards/users?id=1"
            }
          ]
        },
        "users.email": {
          "value": "user1@example.com",
          "rendered": "user1@example.com",
          "html": "<a href='mailto:user1@example.com'>user1@example.com</a>"
        },
        "orders.total_amount": {
          "value": 64.5,
          "rendered": "$64.50",
          "html": "<span style='color: #333;'>$64.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=1"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 2,
          "rendered": "2",
          "links": [
            {
              "label": "User Dashboard 2",
              "url": "/dashboards/users?id=2"
            }
          ]
        },
        "users.email": {
          "value": "user2@example.com",
          "rendered": "user2@example.com",
          "html": "<a href='mailto:user2@example.com'>user2@example.com</a>"
        },
        "orders.total_amount": {
          "value": 61.0,
          "rendered": "$61.00",
          "html": "<span style='color: #333;'>$61.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=2"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 3,
          "rendered": "3",
          "links": [
            {
              "label": "User Dashboard 3",
              "url": "/dashboards/users?id=3"
            }
          ]
        },
        "users.email": {
          "value": "user3@example.com",
          "rendered": "user3@example.com",
          "html": "<a href='mailto:user3@example.com'>user3@example.com</a>"
        },
        "orders.total_amount": {
          "value": 52.5,
          "rendered": "$52.50",
          "html": "<span style='color: #333;'>$52.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=3"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 4,
          "rendered": "4",
          "links": [
            {
              "label": "User Dashboard 4",
              "url": "/dashboards/users?id=4"
            }
          ]
        },
        "users.email": {
          "value": "user4@example.com",
          "rendered": "user4@example.com",
          "html": "<a href='mailto:user4@example.com'>user4@example.com</a>"
        },
        "orders.total_amount": {
          "value": 59.0,
          "rendered": "$59.00",
          "html": "<span style='color: #333;'>$59.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=4"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 5,
          "rendered": "5",
          "links": [
            {
              "label": "User Dashboard 5",
              "url": "/dashboards/users?id=5"
            }
          ]
        },
        "users.email": {
          "value": "user5@example.com",
          "rendered": "user5@example.com",
          "html": "<a href='mailto:user5@example.com'>user5@example.com</a>"
        },
        "orders.total_amount": {
          "value": 63.5,
          "rendered": "$63.50",
          "html": "<span style='color: #333;'>$63.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=5"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 6,
          "rendered": "6",
          "links": [
            {
              "label": "User Dashboard 6",
              "url": "/dashboards/users?id=6"
            }
          ]
        },
        "users.email": {
          "value": "user6@example.com",
          "rendered": "user6@example.com",
          "html": "<a href='mailto:user6@example.com'>user6@example.com</a>"
        },
        "orders.total_amount": {
          "value": 82.0,
          "rendered": "$82.00",
          "html": "<span style='color: #333;'>$82.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=6"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 7,
          "rendered": "7",
          "links": [
            {
              "label": "User Dashboard 7",
              "url": "/dashboards/users?id=7"
            }
          ]
        },
        "users.email": {
          "value": "user7@example.com",
          "rendered": "user7@example.com",
          "html": "<a href='mailto:user7@example.com'>user7@example.com</a>"
        },
        "orders.total_amount": {
          "value": 86.5,
          "rendered": "$86.50",
          "html": "<span style='color: #333;'>$86.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=7"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 8,
          "rendered": "8",
          "links": [
            {
              "label": "User Dashboard 8",
              "url": "/dashboards/users?id=8"
            }
          ]
        },
        "users.email": {
          "value": "user8@example.com",
          "rendered": "user8@example.com",
          "html": "<a href='mailto:user8@example.com'>user8@example.com</a>"
        },
        "orders.total_amount": {
          "value": 103.0,
          "rendered": "$103.00",
          "html": "<span style='color: #333;'>$103.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=8"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 9,
          "rendered": "9",
          "links": [
            {
              "label": "User Dashboard 9",
              "url": "/dashboards/users?id=9"
            }
          ]
        },
        "users.email": {
          "value": "user9@example.com",
          "rendered": "user9@example.com",
          "html": "<a href='mailto:user9@example.com'>user9@example.com</a>"
        },
        "orders.total_amount": {
          "value": 94.5,
          "rendered": "$94.50",
          "html": "<span style='color: #333;'>$94.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=9"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 10,
          "rendered": "10",
          "links": [
            {
              "label": "User Dashboard 10",
              "url": "/dashboards/users?id=10"
            }
          ]
        },
        "users.email": {
          "value": "user10@example.com",
          "rendered": "user10@example.com",
          "html": "<a href='mailto:user10@example.com'>user10@example.com</a>"
        },
        "orders.total_amount": {
          "value": 104.0,
          "rendered": "$104.00",
          "html": "<span style='color: #333;'>$104.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=10"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 11,
          "rendered": "11",
          "links": [
            {
              "label": "User Dashboard 11",
              "url": "/dashboards/users?id=11"
            }
          ]
        },
        "users.email": {
          "value": "user11@example.com",
          "rendered": "user11@example.com",
          "html": "<a href='mailto:user11@example.com'>user11@example.com</a>"
        },
        "orders.total_amount": {
          "value": 102.5,
          "rendered": "$102.50",
          "html": "<span style='color: #333;'>$102.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=11"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 12,
          "rendered": "12",
          "links": [
            {
              "label": "User Dashboard 12",
              "url": "/dashboards/users?id=12"
            }
          ]
        },
        "users.email": {
          "value": "user12@example.com",
          "rendered": "user12@example.com",
          "html": "<a href='mailto:user12@example.com'>user12@example.com</a>"
        },
        "orders.total_amount": {
          "value": 126.0,
          "rendered": "$126.00",
          "html": "<span style='color: #333;'>$126.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=12"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 13,
          "rendered": "13",
          "links": [
            {
              "label": "User Dashboard 13",
              "url": "/dashboards/users?id=13"
            }
          ]
        },
        "users.email": {
          "value": "user13@example.com",
          "rendered": "user13@example.com",
          "html": "<a href='mailto:user13@example.com'>user13@example.com</a>"
        },
        "orders.total_amount": {
          "value": 117.5,
          "rendered": "$117.50",
          "html": "<span style='color: #333;'>$117.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=13"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 14,
          "rendered": "14",
          "links": [
            {
              "label": "User Dashboard 14",
              "url": "/dashboards/users?id=14"
            }
          ]
        },
        "users.email": {
          "value": "user14@example.com",
          "rendered": "user14@example.com",
          "html": "<a href='mailto:user14@example.com'>user14@example.com</a>"
        },
        "orders.total_amount": {
          "value": 125.0,
          "rendered": "$125.00",
          "html": "<span style='color: #333;'>$125.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=14"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 15,
          "rendered": "15",
          "links": [
            {
              "label": "User Dashboard 15",
              "url": "/dashboards/users?id=15"
            }
          ]
        },
        "users.email": {
          "value": "user15@example.com",
          "rendered": "user15@example.com",
          "html": "<a href='mailto:user15@example.com'>user15@example.com</a>"
        },
        "orders.total_amount": {
          "value": 133.5,
          "rendered": "$133.50",
          "html": "<span style='color: #333;'>$133.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=15"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 16,
          "rendered": "16",
          "links": [
            {
              "label": "User Dashboard 16",
              "url": "/dashboards/users?id=16"
            }
          ]
        },
        "users.email": {
          "value": "user16@example.com",
          "rendered": "user16@example.com",
          "html": "<a href='mailto:user16@example.com'>user16@example.com</a>"
        },
        "orders.total_amount": {
          "value": 147.0,
          "rendered": "$147.00",
          "html": "<span style='color: #333;'>$147.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=16"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 17,
          "rendered": "17",
          "links": [
            {
              "label": "User Dashboard 17",
              "url": "/dashboards/users?id=17"
            }
          ]
        },
        "users.email": {
          "value": "user17@example.com",
          "rendered": "user17@example.com",
          "html": "<a href='mailto:user17@example.com'>user17@example.com</a>"
        },
        "orders.total_amount": {
          "value": 143.5,
          "rendered": "$143.50",
          "html": "<span style='color: #333;'>$143.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=17"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 18,
          "rendered": "18",
          "links": [
            {
              "label": "User Dashboard 18",
              "url": "/dashboards/users?id=18"
            }
          ]
        },
        "users.email": {
          "value": "user18@example.com",
          "rendered": "user18@example.com",
          "html": "<a href='mailto:user18@example.com'>user18@example.com</a>"
        },
        "orders.total_amount": {
          "value": 163.0,
          "rendered": "$163.00",
          "html": "<span style='color: green;'>$163.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=18"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 19,
          "rendered": "19",
          "links": [
            {
              "label": "User Dashboard 19",
              "url": "/dashboards/users?id=19"
            }
          ]
        },
        "users.email": {
          "value": "user19@example.com",
          "rendered": "user19@example.com",
          "html": "<a href='mailto:user19@example.com'>user19@example.com</a>"
        },
        "orders.total_amount": {
          "value": 147.5,
          "rendered": "$147.50",
          "html": "<span style='color: #333;'>$147.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=19"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 20,
          "rendered": "20",
          "links": [
            {
              "label": "User Dashboard 20",
              "url": "/dashboards/users?id=20"
            }
          ]
        },
        "users.email": {
          "value": "user20@example.com",
          "rendered": "user20@example.com",
          "html": "<a href='mailto:user20@example.com'>user20@example.com</a>"
        },
        "orders.total_amount": {
          "value": 168.0,
          "rendered": "$168.00",
          "html": "<span style='color: green;'>$168.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=20"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 21,
          "rendered": "21",
          "links": [
            {
              "label": "User Dashboard 21",
              "url": "/dashboards/users?id=21"
            }
          ]
        },
        "users.email": {
          "value": "user21@example.com",
          "rendered": "user21@example.com",
          "html": "<a href='mailto:user21@example.com'>user21@example.com</a>"
        },
        "orders.total_amount": {
          "value": 167.5,
          "rendered": "$167.50",
          "html": "<span style='color: green;'>$167.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=21"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 22,
          "rendered": "22",
          "links": [
            {
              "label": "User Dashboard 22",
              "url": "/dashboards/users?id=22"
            }
          ]
        },
        "users.email": {
          "value": "user22@example.com",
          "rendered": "user22@example.com",
          "html": "<a href='mailto:user22@example.com'>user22@example.com</a>"
        },
        "orders.total_amount": {
          "value": 162.0,
          "rendered": "$162.00",
          "html": "<span style='color: green;'>$162.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=22"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 23,
          "rendered": "23",
          "links": [
            {
              "label": "User Dashboard 23",
              "url": "/dashboards/users?id=23"
            }
          ]
        },
        "users.email": {
          "value": "user23@example.com",
          "rendered": "user23@example.com",
          "html": "<a href='mailto:user23@example.com'>user23@example.com</a>"
        },
        "orders.total_amount": {
          "value": 176.5,
          "rendered": "$176.50",
          "html": "<span style='color: green;'>$176.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=23"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 24,
          "rendered": "24",
          "links": [
            {
              "label": "User Dashboard 24",
              "url": "/dashboards/users?id=24"
            }
          ]
        },
        "users.email": {
          "value": "user24@example.com",
          "rendered": "user24@example.com",
          "html": "<a href='mailto:user24@example.com'>user24@example.com</a>"
        },
        "orders.total_amount": {
          "value": 188.0,
          "rendered": "$188.00",
          "html": "<span style='color: green;'>$188.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=24"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 25,
          "rendered": "25",
          "links": [
            {
              "label": "User Dashboard 25",
              "url": "/dashboards/users?id=25"
            }
          ]
        },
        "users.email": {
          "value": "user25@example.com",
          "rendered": "user25@example.com",
          "html": "<a href='mailto:user25@example.com'>user25@example.com</a>"
        },
        "orders.total_amount": {
          "value": 189.5,
          "rendered": "$189.50",
          "html": "<span style='color: green;'>$189.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=25"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 26,
          "rendered": "26",
          "links": [
            {
              "label": "User Dashboard 26",
              "url": "/dashboards/users?id=26"
            }
          ]
        },
        "users.email": {
          "value": "user26@example.com",
          "rendered": "user26@example.com",
          "html": "<a href='mailto:user26@example.com'>user26@example.com</a>"
        },
        "orders.total_amount": {
          "value": 188.0,
          "rendered": "$188.00",
          "html": "<span style='color: green;'>$188.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=26"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 27,
          "rendered": "27",
          "links": [
            {
              "label": "User Dashboard 27",
              "url": "/dashboards/users?id=27"
            }
          ]
        },
        "users.email": {
          "value": "user27@example.com",
          "rendered": "user27@example.com",
          "html": "<a href='mailto:user27@example.com'>user27@example.com</a>"
        },
        "orders.total_amount": {
          "value": 205.5,
          "rendered": "$205.50",
          "html": "<span style='color: green;'>$205.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=27"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 28,
          "rendered": "28",
          "links": [
            {
              "label": "User Dashboard 28",
              "url": "/dashboards/users?id=28"
            }
          ]
        },
        "users.email": {
          "value": "user28@example.com",
          "rendered": "user28@example.com",
          "html": "<a href='mailto:user28@example.com'>user28@example.com</a>"
        },
        "orders.total_amount": {
          "value": 191.0,
          "rendered": "$191.00",
          "html": "<span style='color: green;'>$191.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=28"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 29,
          "rendered": "29",
          "links": [
            {
              "label": "User Dashboard 29",
              "url": "/dashboards/users?id=29"
            }
          ]
        },
        "users.email": {
          "value": "user29@example.com",
          "rendered": "user29@example.com",
          "html": "<a href='mailto:user29@example.com'>user29@example.com</a>"
        },
        "orders.total_amount": {
          "value": 209.5,
          "rendered": "$209.50",
          "html": "<span style='color: green;'>$209.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=29"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 30,
          "rendered": "30",
          "links": [
            {
              "label": "User Dashboard 30",
              "url": "/dashboards/users?id=30"
            }
          ]
        },
        "users.email": {
          "value": "user30@example.com",
          "rendered": "user30@example.com",
          "html": "<a href='mailto:user30@example.com'>user30@example.com</a>"
        },
        "orders.total_amount": {
          "value": 220.0,
          "rendered": "$220.00",
          "html": "<span style='color: green;'>$220.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=30"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 31,
          "rendered": "31",
          "links": [
            {
              "label": "User Dashboard 31",
              "url": "/dashboards/users?id=31"
            }
          ]
        },
        "users.email": {
          "value": "user31@example.com",
          "rendered": "user31@example.com",
          "html": "<a href='mailto:user31@example.com'>user31@example.com</a>"
        },
        "orders.total_amount": {
          "value": 221.5,
          "rendered": "$221.50",
          "html": "<span style='color: green;'>$221.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=31"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 32,
          "rendered": "32",
          "links": [
            {
              "label": "User Dashboard 32",
              "url": "/dashboards/users?id=32"
            }
          ]
        },
        "users.email": {
          "value": "user32@example.com",
          "rendered": "user32@example.com",
          "html": "<a href='mailto:user32@example.com'>user32@example.com</a>"
        },
        "orders.total_amount": {
          "value": 230.0,
          "rendered": "$230.00",
          "html": "<span style='color: green;'>$230.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=32"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 33,
          "rendered": "33",
          "links": [
            {
              "label": "User Dashboard 33",
              "url": "/dashboards/users?id=33"
            }
          ]
        },
        "users.email": {
          "value": "user33@example.com",
          "rendered": "user33@example.com",
          "html": "<a href='mailto:user33@example.com'>user33@example.com</a>"
        },
        "orders.total_amount": {
          "value": 243.5,
          "rendered": "$243.50",
          "html": "<span style='color: green;'>$243.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=33"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 34,
          "rendered": "34",
          "links": [
            {
              "label": "User Dashboard 34",
              "url": "/dashboards/users?id=34"
            }
          ]
        },
        "users.email": {
          "value": "user34@example.com",
          "rendered": "user34@example.com",
          "html": "<a href='mailto:user34@example.com'>user34@example.com</a>"
        },
        "orders.total_amount": {
          "value": 246.0,
          "rendered": "$246.00",
          "html": "<span style='color: green;'>$246.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=34"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 35,
          "rendered": "35",
          "links": [
            {
              "label": "User Dashboard 35",
              "url": "/dashboards/users?id=35"
            }
          ]
        },
        "users.email": {
          "value": "user35@example.com",
          "rendered": "user35@example.com",
          "html": "<a href='mailto:user35@example.com'>user35@example.com</a>"
        },
        "orders.total_amount": {
          "value": 239.5,
          "rendered": "$239.50",
          "html": "<span style='color: green;'>$239.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=35"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 36,
          "rendered": "36",
          "links": [
            {
              "label": "User Dashboard 36",
              "url": "/dashboards/users?id=36"
            }
          ]
        },
        "users.email": {
          "value": "user36@example.com",
          "rendered": "user36@example.com",
          "html": "<a href='mailto:user36@example.com'>user36@example.com</a>"
        },
        "orders.total_amount": {
          "value": 258.0,
          "rendered": "$258.00",
          "html": "<span style='color: green;'>$258.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=36"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 37,
          "rendered": "37",
          "links": [
            {
              "label": "User Dashboard 37",
              "url": "/dashboards/users?id=37"
            }
          ]
        },
        "users.email": {
          "value": "user37@example.com",
          "rendered": "user37@example.com",
          "html": "<a href='mailto:user37@example.com'>user37@example.com</a>"
        },
        "orders.total_amount": {
          "value": 263.5,
          "rendered": "$263.50",
          "html": "<span style='color: green;'>$263.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=37"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 38,
          "rendered": "38",
          "links": [
            {
              "label": "User Dashboard 38",
              "url": "/dashboards/users?id=38"
            }
          ]
        },
        "users.email": {
          "value": "user38@example.com",
          "rendered": "user38@example.com",
          "html": "<a href='mailto:user38@example.com'>user38@example.com</a>"
        },
        "orders.total_amount": {
          "value": 246.0,
          "rendered": "$246.00",
          "html": "<span style='color: green;'>$246.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=38"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 39,
          "rendered": "39",
          "links": [
            {
              "label": "User Dashboard 39",
              "url": "/dashboards/users?id=39"
            }
          ]
        },
        "users.email": {
          "value": "user39@example.com",
          "rendered": "user39@example.com",
          "html": "<a href='mailto:user39@example.com'>user39@example.com</a>"
        },
        "orders.total_amount": {
          "value": 279.5,
          "rendered": "$279.50",
          "html": "<span style='color: green;'>$279.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=39"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 40,
          "rendered": "40",
          "links": [
            {
              "label": "User Dashboard 40",
              "url": "/dashboards/users?id=40"
            }
          ]
        },
        "users.email": {
          "value": "user40@example.com",
          "rendered": "user40@example.com",
          "html": "<a href='mailto:user40@example.com'>user40@example.com</a>"
        },
        "orders.total_amount": {
          "value": 282.0,
          "rendered": "$282.00",
          "html": "<span style='color: green;'>$282.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=40"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 41,
          "rendered": "41",
          "links": [
            {
              "label": "User Dashboard 41",
              "url": "/dashboards/users?id=41"
            }
          ]
        },
        "users.email": {
          "value": "user41@example.com",
          "rendered": "user41@example.com",
          "html": "<a href='mailto:user41@example.com'>user41@example.com</a>"
        },
        "orders.total_amount": {
          "value": 279.5,
          "rendered": "$279.50",
          "html": "<span style='color: green;'>$279.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=41"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 42,
          "rendered": "42",
          "links": [
            {
              "label": "User Dashboard 42",
              "url": "/dashboards/users?id=42"
            }
          ]
        },
        "users.email": {
          "value": "user42@example.com",
          "rendered": "user42@example.com",
          "html": "<a href='mailto:user42@example.com'>user42@example.com</a>"
        },
        "orders.total_amount": {
          "value": 287.0,
          "rendered": "$287.00",
          "html": "<span style='color: green;'>$287.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=42"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 43,
          "rendered": "43",
          "links": [
            {
              "label": "User Dashboard 43",
              "url": "/dashboards/users?id=43"
            }
          ]
        },
        "users.email": {
          "value": "user43@example.com",
          "rendered": "user43@example.com",
          "html": "<a href='mailto:user43@example.com'>user43@example.com</a>"
        },
        "orders.total_amount": {
          "value": 286.5,
          "rendered": "$286.50",
          "html": "<span style='color: green;'>$286.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=43"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 44,
          "rendered": "44",
          "links": [
            {
              "label": "User Dashboard 44",
              "url": "/dashboards/users?id=44"
            }
          ]
        },
        "users.email": {
          "value": "user44@example.com",
          "rendered": "user44@example.com",
          "html": "<a href='mailto:user44@example.com'>user44@example.com</a>"
        },
        "orders.total_amount": {
          "value": 292.0,
          "rendered": "$292.00",
          "html": "<span style='color: green;'>$292.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=44"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 45,
          "rendered": "45",
          "links": [
            {
              "label": "User Dashboard 45",
              "url": "/dashboards/users?id=45"
            }
          ]
        },
        "users.email": {
          "value": "user45@example.com",
          "rendered": "user45@example.com",
          "html": "<a href='mailto:user45@example.com'>user45@example.com</a>"
        },
        "orders.total_amount": {
          "value": 311.5,
          "rendered": "$311.50",
          "html": "<span style='color: green;'>$311.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=45"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 46,
          "rendered": "46",
          "links": [
            {
              "label": "User Dashboard 46",
              "url": "/dashboards/users?id=46"
            }
          ]
        },
        "users.email": {
          "value": "user46@example.com",
          "rendered": "user46@example.com",
          "html": "<a href='mailto:user46@example.com'>user46@example.com</a>"
        },
        "orders.total_amount": {
          "value": 295.0,
          "rendered": "$295.00",
          "html": "<span style='color: green;'>$295.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=46"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 47,
          "rendered": "47",
          "links": [
            {
              "label": "User Dashboard 47",
              "url": "/dashboards/users?id=47"
            }
          ]
        },
        "users.email": {
          "value": "user47@example.com",
          "rendered": "user47@example.com",
          "html": "<a href='mailto:user47@example.com'>user47@example.com</a>"
        },
        "orders.total_amount": {
          "value": 303.5,
          "rendered": "$303.50",
          "html": "<span style='color: green;'>$303.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=47"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 48,
          "rendered": "48",
          "links": [
            {
              "label": "User Dashboard 48",
              "url": "/dashboards/users?id=48"
            }
          ]
        },
        "users.email": {
          "value": "user48@example.com",
          "rendered": "user48@example.com",
          "html": "<a href='mailto:user48@example.com'>user48@example.com</a>"
        },
        "orders.total_amount": {
          "value": 308.0,
          "rendered": "$308.00",
          "html": "<span style='color: green;'>$308.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=48"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 49,
          "rendered": "49",
          "links": [
            {
              "label": "User Dashboard 49",
              "url": "/dashboards/users?id=49"
            }
          ]
        },
        "users.email": {
          "value": "user49@example.com",
          "rendered": "user49@example.com",
          "html": "<a href='mailto:user49@example.com'>user49@example.com</a>"
        },
        "orders.total_amount": {
          "value": 332.5,
          "rendered": "$332.50",
          "html": "<span style='color: green;'>$332.50</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=49"
            }
          ]
        }
      },
      {
        "users.id": {
          "value": 50,
          "rendered": "50",
          "links": [
            {
              "label": "User Dashboard 50",
              "url": "/dashboards/users?id=50"
            }
          ]
        },
        "users.email": {
          "value": "user50@example.com",
          "rendered": "user50@example.com",
          "html": "<a href='mailto:user50@example.com'>user50@example.com</a>"
        },
        "orders.total_amount": {
          "value": 336.0,
          "rendered": "$336.00",
          "html": "<span style='color: green;'>$336.00</span>",
          "links": [
            {
              "label": "Drill Order Details",
              "url": "/explore/orders?user_id=50"
            }
          ]
        }
      }
    ],
    "queryResponse": {
      "fields": {
        "dimensions": [
          {
            "name": "users.id",
            "label": "User ID",
            "type": "number"
          },
          {
            "name": "users.email",
            "label": "Email",
            "type": "string"
          }
        ],
        "measures": [
          {
            "name": "orders.total_amount",
            "label": "Total Amount",
            "type": "number"
          }
        ]
      }
    }
  },
  "no_data": {
    "config": {},
    "data": [],
    "queryResponse": {
      "fields": {
        "dimensions": [
          {
            "name": "users.state",
            "label": "State",
            "type": "string"
          }
        ],
        "measures": [
          {
            "name": "orders.count",
            "label": "Orders Count",
            "type": "number"
          }
        ]
      }
    }
  }
};
