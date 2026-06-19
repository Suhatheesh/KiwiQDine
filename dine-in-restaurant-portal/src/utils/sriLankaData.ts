// Sri Lanka Districts and Cities Data
export interface District {
    name: string;
    cities: string[];
}

export const NEW_ZEALAND_DISTRICTS: District[] = [
    {
        name: "Auckland",
        cities: ["Auckland", "Manukau", "Waitakere", "North Shore", "Papakura"]
    },
    {
        name: "Bay of Plenty",
        cities: ["Tauranga", "Rotorua", "Whakatane"]
    },
    {
        name: "Canterbury",
        cities: ["Christchurch", "Timaru", "Ashburton"]
    },
    {
        name: "Gisborne",
        cities: ["Gisborne"]
    },
    {
        name: "Hawke’s Bay",
        cities: ["Napier", "Hastings"]
    },
    {
        name: "Manawatū-Whanganui",
        cities: ["Palmerston North", "Whanganui"]
    },
    {
        name: "Marlborough",
        cities: ["Blenheim"]
    },
    {
        name: "Nelson",
        cities: ["Nelson"]
    },
    {
        name: "Northland",
        cities: ["Whangarei"]
    },
    {
        name: "Otago",
        cities: ["Dunedin", "Queenstown", "Wanaka"]
    },
    {
        name: "Southland",
        cities: ["Invercargill"]
    },
    {
        name: "Taranaki",
        cities: ["New Plymouth"]
    },
    {
        name: "Tasman",
        cities: ["Richmond", "Motueka"]
    },
    {
        name: "Waikato",
        cities: ["Hamilton", "Taupo", "Cambridge"]
    },
    {
        name: "Wellington",
        cities: ["Wellington", "Lower Hutt", "Upper Hutt", "Porirua"]
    },
    {
        name: "West Coast",
        cities: ["Greymouth", "Hokitika"]
    }
];

export const getAllDistricts = (): string[] => {
    return NEW_ZEALAND_DISTRICTS.map((d) => d.name).sort();
};

export const getCitiesByDistrict = (districtName: string): string[] => {
    const district = NEW_ZEALAND_DISTRICTS.find((d) => d.name === districtName);
    return district ? district.cities.sort() : [];
};

export const getAllCities = (): string[] => {
    return NEW_ZEALAND_DISTRICTS.flatMap((d) => d.cities).sort();
};