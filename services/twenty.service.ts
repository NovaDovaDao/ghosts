import { Context } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import {
  gql,
  GraphQLClient,
} from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";

export const importCompanies = async (ctx: Context) => {
  // FIXME: validate data with zod
  const payload: CompanyData[] = await ctx.request.body.json();
  if (!payload || payload.length < 1) throw new Error("Invalid payload");

  const endpoint = "http://api.novadova.com/graphql";
  const authToken = Deno.env.get("TWENTY_API_KEY");

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${authToken}`,
    },
  });

  const mutation = gql`
    mutation CreateCompanies($data: [CompanyCreateInput!]!, $upsert: Boolean) {
      createCompanies(data: $data, upsert: $upsert) {
        __typename
        createdAt
        name
      }
    }
  `;

  const variables = {
    data: payload.map((cd) => ({
      name: cd.CompanyName,
      domainName: cd.Website
        ? {
            primaryLinkLabel: cd.Website,
            primaryLinkUrl: cd.Website,
            secondaryLinks: [],
          }
        : undefined,
      address: {
        addressCity: cd.City,
        addressCountry: "United States",
        addressPostcode: String(cd.Zip),
        addressState: cd.State,
        addressStreet1: cd.Street ?? "",
        addressStreet2: cd.Street2 ?? "",
      },
      phone: {
        primaryPhoneCallingCode: "+1",
        primaryPhoneCountryCode: "US",
        primaryPhoneNumber: cd.Phone ?? "",
      },
    })),
    upsert: false,
  } satisfies { data: CompanyCreateInput[]; upsert: boolean };

  await graphQLClient
    .request(mutation, variables)
    .then((results) =>
      console.log(
        `Upserted ${results.createCompanies.length} companies to Twenty`
      )
    )
    .catch((err) => console.error(JSON.stringify(err, null, 2)));
};

interface CompanyData {
  CompanyName: string;
  ContactName?: null | string;
  Email?: string;
  JobPosition?: string | null;
  Phone?: string;
  Mobile?: string | null;
  Street?: string;
  Street2?: string | null;
  City: string;
  State: string;
  Zip: number;
  Website?: string;
  Notes?: string | null;
}

/** A company */
export type CompanyCreateInput = {
  /** The company address */
  address?: {
    addressCity: string;
    addressCountry: string;
    addressLat?: number;
    addressLng?: number;
    addressPostcode: string;
    addressState: string;
    addressStreet1: string;
    addressStreet2: string;
  };
  /** The company website URL. We use this url to fetch the company icon */
  domainName?: {
    primaryLinkLabel: string;
    primaryLinkUrl: string;
    secondaryLinks: Array<CompanyCreateInput["domainName"]>;
  };
  /** Number of employees in the company */
  employees?: number;
  /** Ideal Customer Profile:  Indicates whether the company is the most suitable and valuable customer for you */
  idealCustomerProfile?: boolean;
  /** The company name */
  name?: string;
  /** The company Twitter/X account */
  xLink?: {
    label?: string;
    url?: string;
  };

  phone?: {
    additionalPhones?: Array<CompanyCreateInput["phone"]>;
    primaryPhoneCallingCode: string;
    primaryPhoneCountryCode: string;
    primaryPhoneNumber: string;
  };
};
