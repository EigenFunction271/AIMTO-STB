// WORKFLOW RUNNER
// workflow.js supplies four Broken/Answer stage functions; this file only runs them in order.
// Each stage returns { ok, value } on success or { ok: false, chatResponse } when it stops.
export async function runOrderBotWith(pipeline, message, complete) {
  const report = {
    status: "running",
    stage: "extract",
    order: null,
    invoice: null,
    events: [],
  };

  const extracted = await pipeline.extract(message, complete);
  if (!extracted.ok) {
    report.status = "stopped";
    report.events.push(
      "Extraction output did not match the order contract.",
      "The order was not saved.",
      "Pricing and invoice creation did not start.",
    );
    console.error("[save-the-build] pipeline stopped at extract", { chatResponse: extracted.chatResponse });
    return { chatResponse: extracted.chatResponse, report };
  }
  report.order = extracted.value;
  report.events.push("The order was validated and saved.");

  report.stage = "price";
  const priced = await pipeline.price(extracted.value, complete);
  if (!priced.ok) {
    report.status = "stopped";
    report.events.push(
      "Pricing stopped before a trusted total was created.",
      "Invoice creation did not start.",
    );
    console.error("[save-the-build] pipeline stopped at price", { chatResponse: priced.chatResponse });
    return { chatResponse: priced.chatResponse, report };
  }
  report.order = priced.value;
  report.events.push(`Pricing completed in code: RM${priced.value.totalRm}.`);

  report.stage = "invoice";
  const invoice = await pipeline.invoice(priced.value);
  if (!invoice.ok) {
    report.status = "stopped";
    report.events.push("The invoice was not saved because the handoff dropped required order details.");
    console.error("[save-the-build] pipeline stopped at invoice", { chatResponse: invoice.chatResponse });
    return { chatResponse: invoice.chatResponse, report };
  }
  report.invoice = invoice.value;
  report.events.push("The invoice was created from the validated order.");

  report.stage = "reply";
  const reply = await pipeline.reply(invoice.value, complete);
  if (!reply.ok) {
    report.status = "stopped";
    report.events.push("The customer reply came from the model and may contain unsupported promises.");
    console.error("[save-the-build] pipeline stopped at reply", { chatResponse: reply.chatResponse });
    return { chatResponse: reply.chatResponse, report };
  }

  report.status = "complete";
  report.stage = "complete";
  report.events.push("The customer reply was built from validated invoice facts.");
  return { chatResponse: reply.chatResponse, report };
}
