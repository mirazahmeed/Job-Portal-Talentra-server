const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.7cdmalj.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		const jobsCollection = client.db("talentra").collection("jobs");

		const applicationsCollection = client
			.db("talentra")
			.collection("applications");

		//jobs api

		app.get("/jobs", async (req, res) => {
			const email = req.query.email;
			const query = {};
			if (email) {
				query.hr_email = email;
			}
			const cursor = jobsCollection.find(query);
			const jobs = await cursor.toArray();
			res.send(jobs);
		});

		app.get("/jobs/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const job = await jobsCollection.findOne(query);
			res.send(job);
		});

		app.post("/jobs", async (req, res) => {
			const newJob = req.body;
			console.log(newJob);
			const result = await jobsCollection.insertOne(newJob);
			res.send(result);
		});

		// jpb applications related apis
		app.get("/applications", async (req, res) => {
			const email = req.query.email;
			const query = { applicantEmail: email };
			const result = await applicationsCollection.find(query).toArray();

			// bad way
			for (const application of result) {
				const jobId = application.jobId;
				const jobQuery = { _id: new ObjectId(jobId) };
				const job = await jobsCollection.findOne(jobQuery);
				application.company = job.company;
				application.title = job.title;
				application.company_logo = job.company_logo;
				application.location = job.location;
				application.jobType = job.jobType;
			}

			res.send(result);
		});

		app.get("/applications/job/:job_id", async (req, res) => {
			const job_id = req.params.job_id;
			console.log(job_id);
			const query = { jobId: job_id };
			const cursor = applicationsCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});

		app.post("/applications", async (req, res) => {
			const application = req.body;
			console.log(application);
			const result = await applicationsCollection.insertOne(application);
			res.send(result);
		});

		app.delete("/applications/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await applicationsCollection.deleteOne(query);
			res.send(result);
		});

		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!",
		);
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Job Portal Talentra server!");
});

app.listen(port, () => {
	console.log(`Job Portal app Talentra server is running on port ${port}`);
});
