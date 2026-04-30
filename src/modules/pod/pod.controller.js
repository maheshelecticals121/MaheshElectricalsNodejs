import * as podService from "./pod.service.js";

/* =====================================
   SAVE POD
===================================== */
export async function savePodController(req, reply) {
  try {
    const pod = await podService.savePodService(req);

    return reply.send({
      success: true,
      message: "POD request submitted successfully",
      data: pod,
    });
  } catch (err) {
    req.log?.error(err);

    return reply.code(err.statusCode || 400).send({
      success: false,
      message: err.message || "Failed to submit POD request",
    });
  }
}

/* =====================================
   GET ALL POD (ADMIN)
===================================== */
export async function getAllPodController(req, reply) {
  try {
    const pods = await podService.getAllPodService();

    return reply.send({
      success: true,
      data: pods,
    });
  } catch (err) {
    req.log?.error(err);

    return reply.code(500).send({
      success: false,
      message: "Failed to fetch POD requests",
    });
  }
}
