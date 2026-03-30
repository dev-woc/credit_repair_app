import type { Agency, Client } from "@/types";

export function generateCroaContract(
	agency: Agency,
	client: Omit<Client, "id" | "agencyId" | "createdAt" | "updatedAt"> & { id?: string },
): string {
	const today = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const cancellationDeadline = calculateCancellationDeadline(new Date());
	const deadlineStr = cancellationDeadline.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return `CREDIT REPAIR SERVICES AGREEMENT
Prepared under the Credit Repair Organizations Act (CROA), 15 U.S.C. § 1679 et seq.

Date: ${today}
Agency: ${agency.name}
Client: ${client.firstName} ${client.lastName}
Client Email: ${client.email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONSUMER CREDIT FILE RIGHTS UNDER STATE AND FEDERAL LAW

You have a right to dispute inaccurate information in your credit report by contacting the credit bureau directly. There is no fee for this. Any reputable credit repair organization will also inform you of your rights and provide you with details on what they can do for you. For questions or complaints about credit repair companies, contact the Federal Trade Commission at 1-877-FTC-HELP (1-877-382-4357) or online at www.ftc.gov.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RIGHT TO CANCEL

YOU MAY CANCEL THIS CONTRACT, WITHOUT ANY PENALTY OR OBLIGATION, AT ANY TIME BEFORE MIDNIGHT OF THE 3RD BUSINESS DAY AFTER THE DATE YOU SIGNED THIS CONTRACT.

Your cancellation deadline is: ${deadlineStr}

To cancel, notify ${agency.name} in writing. Keep a copy of your cancellation notice.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SERVICES TO BE PERFORMED

${agency.name} agrees to perform the following services on behalf of the Client:

1. Review and analysis of Client's credit reports from Equifax, Experian, and TransUnion
2. Identification of potentially inaccurate, incomplete, unverifiable, or outdated information
3. Preparation and submission of written dispute letters on Client's behalf, with Client authorization
4. Tracking of bureau investigation timelines (30-45 days per FCRA § 611)
5. Reporting of dispute outcomes to Client
6. Ongoing monitoring and advisory services as agreed

All dispute letters are unique and evidence-based per client per FCRA requirements. No identical template letters are sent on behalf of multiple clients.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROHIBITED REPRESENTATIONS

${agency.name} makes NO guarantee or representation that:
- Any specific item will be removed from the Client's credit report
- The Client's credit score will increase by any specific amount or at all
- The Client's creditworthiness will improve

Only inaccurate, incomplete, or unverifiable information may be legally disputed. Accurate negative information that is legally reportable CANNOT be permanently removed by any credit repair organization.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT TERMS

Services are billed monthly AFTER the close of each service period. No fees are collected in advance of services rendered, in accordance with the Credit Repair Organizations Act.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLIENT AUTHORIZATION

By signing this agreement, Client authorizes ${agency.name} to:
- Obtain and review Client's credit reports on Client's behalf
- Prepare and submit dispute correspondence on Client's behalf
- Communicate with credit bureaus, creditors, and collection agencies regarding items in Client's credit file

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GOVERNING LAW

This agreement is governed by the Credit Repair Organizations Act (15 U.S.C. § 1679 et seq.), the Fair Credit Reporting Act (15 U.S.C. § 1681 et seq.), and applicable state law.

Client acknowledges reading and understanding this agreement and the Consumer Credit File Rights disclosure above.

Client: ${client.firstName} ${client.lastName}
Agency: ${agency.name}
`;
}

export function calculateCancellationDeadline(signedAt: Date): Date {
	const deadline = new Date(signedAt);
	let daysAdded = 0;
	while (daysAdded < 3) {
		deadline.setDate(deadline.getDate() + 1);
		const day = deadline.getDay();
		if (day !== 0 && day !== 6) daysAdded++;
	}
	return deadline;
}
