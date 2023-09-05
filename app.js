const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: "./covid19India.db",
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/states", async (req, res) => {
  try {
    const getStates = `select * from state`;
    const response = await db.all(getStates);
    res.send(
      response.map((list) => {
        return {
          stateId: list.state_id,
          stateName: list.state_name,
          population: list.population,
        };
      })
    );
  } catch (error) {
    console.log(error);
  }
});

app.get("/states/:stateId", async (req, res) => {
  try {
    const { stateId } = req.params;
    const getSingleState = `select * from state where state_id=${stateId};`;
    const response = await db.get(getSingleState);

    res.send({
      stateId: response.state_id,
      stateName: response.state_name,
      population: response.population,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/districts", async (req, res) => {
  try {
    const { districtName, stateId, cases, cured, active, deaths } = req.body;
    const InsertDistricts = `insert into district(district_name, state_id, cases, cured, active, deaths) 
        values('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths})`;
    await db.run(InsertDistricts);
    res.send("District Successfully Added");
  } catch (error) {
    console.log(error);
  }
});

app.get("/districts/:districtId", async (req, res) => {
  try {
    const { districtId } = req.params;
    const getSingleDistrict = `select * from district where district_id=${districtId}`;
    const response = await db.get(getSingleDistrict);
    res.send({
      districtId: response.district_id,
      districtName: response.district_name,
      stateId: response.state_id,
      cases: response.cases,
      cured: response.cured,
      active: response.active,
      deaths: response.deaths,
    });
  } catch (error) {
    console.log(error);
  }
});

app.delete("/districts/:districtId", async (req, res) => {
  try {
    const { districtId } = req.params;
    const deleteDistrict = `delete from district where district_id=${districtId}`;
    await db.run(deleteDistrict);
    res.send("District Removed");
  } catch (error) {
    console.log(error);
  }
});

app.put("/districts/:districtId", async (req, res) => {
  try {
    const { districtId } = req.params;
    const { districtName, stateId, cases, cured, active, deaths } = req.body;
    const updateDistrict = `update district set district_name='${districtName}', state_id=${stateId},
        cases=${cases}, cured=${cured}, active=${active}, deaths=${deaths} where district_id=${districtId}`;
    await db.run(updateDistrict);
    res.send("District Details Updated");
  } catch (error) {
    console.log(error);
  }
});

app.get("/states/:stateId/stats", async (req, res) => {
  try {
    const { stateId } = req.params;
    const getStats = `SELECT 
    SUM(d.cases) AS totalCases,
    SUM(d.cured) AS totalCured,
    SUM(d.active) AS totalActive,
    SUM(d.deaths) AS totalDeaths
FROM
    state s
JOIN
    district d ON s.state_id = d.state_id
WHERE
    s.state_id = ${stateId}
GROUP BY
    s.state_id, s.state_name;
`;
    const response = await db.get(getStats);
    res.send(response);
  } catch (error) {
    console.log(console.log(error));
  }
});

app.get("/districts/:districtId/details", async (req, res) => {
  try {
    const { districtId } = req.params;
    const getDistrict = `SELECT
    s.state_name as stateName
FROM
    state s
JOIN
    district d ON s.state_id = d.state_id
WHERE
    d.district_id = ${districtId};
`;
    const response = await db.get(getDistrict);
    res.send(response);
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
