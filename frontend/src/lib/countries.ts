export interface City {
  name: string;
}

export interface State {
  name: string;
  cities: City[];
}

export interface Country {
  name: string;
  states: State[];
}

export const COUNTRIES: Country[] = [
  {
    name: 'India',
    states: [
      {
        name: 'Andhra Pradesh',
        cities: [
          { name: 'Visakhapatnam' },
          { name: 'Vijayawada' },
          { name: 'Hyderabad' },
          { name: 'Tirupati' },
          { name: 'Nellore' },
        ],
      },
      {
        name: 'Arunachal Pradesh',
        cities: [
          { name: 'Itanagar' },
          { name: 'Pasighat' },
          { name: 'Tezu' },
        ],
      },
      {
        name: 'Assam',
        cities: [
          { name: 'Guwahati' },
          { name: 'Silchar' },
          { name: 'Dibrugarh' },
          { name: 'Nagaon' },
        ],
      },
      {
        name: 'Bihar',
        cities: [
          { name: 'Patna' },
          { name: 'Gaya' },
          { name: 'Bhagalpur' },
          { name: 'Muzaffarpur' },
          { name: 'Darbhanga' },
        ],
      },
      {
        name: 'Chhattisgarh',
        cities: [
          { name: 'Raipur' },
          { name: 'Bilaspur' },
          { name: 'Durg' },
          { name: 'Rajnandgaon' },
        ],
      },
      {
        name: 'Goa',
        cities: [
          { name: 'Panaji' },
          { name: 'Margao' },
          { name: 'Vasco da Gama' },
        ],
      },
      {
        name: 'Gujarat',
        cities: [
          { name: 'Ahmedabad' },
          { name: 'Surat' },
          { name: 'Vadodara' },
          { name: 'Rajkot' },
          { name: 'Gandhinagar' },
          { name: 'Junagadh' },
          { name: 'Bhavnagar' },
        ],
      },
      {
        name: 'Haryana',
        cities: [
          { name: 'Chandigarh' },
          { name: 'Faridabad' },
          { name: 'Gurgaon' },
          { name: 'Hisar' },
          { name: 'Rohtak' },
        ],
      },
      {
        name: 'Himachal Pradesh',
        cities: [
          { name: 'Shimla' },
          { name: 'Solan' },
          { name: 'Mandi' },
          { name: 'Kangra' },
        ],
      },
      {
        name: 'Jharkhand',
        cities: [
          { name: 'Ranchi' },
          { name: 'Jamshedpur' },
          { name: 'Dhanbad' },
          { name: 'Giridih' },
        ],
      },
      {
        name: 'Karnataka',
        cities: [
          { name: 'Bangalore' },
          { name: 'Mysore' },
          { name: 'Mangalore' },
          { name: 'Belgaum' },
          { name: 'Hubli' },
          { name: 'Davangere' },
        ],
      },
      {
        name: 'Kerala',
        cities: [
          { name: 'Thiruvananthapuram' },
          { name: 'Kochi' },
          { name: 'Kozhikode' },
          { name: 'Thrissur' },
          { name: 'Kottayam' },
        ],
      },
      {
        name: 'Madhya Pradesh',
        cities: [
          { name: 'Bhopal' },
          { name: 'Indore' },
          { name: 'Gwalior' },
          { name: 'Jabalpur' },
          { name: 'Ujjain' },
        ],
      },
      {
        name: 'Maharashtra',
        cities: [
          { name: 'Mumbai' },
          { name: 'Pune' },
          { name: 'Nagpur' },
          { name: 'Aurangabad' },
          { name: 'Nashik' },
          { name: 'Kolhapur' },
          { name: 'Navi Mumbai' },
        ],
      },
      {
        name: 'Manipur',
        cities: [
          { name: 'Imphal' },
          { name: 'Bishnupur' },
        ],
      },
      {
        name: 'Meghalaya',
        cities: [
          { name: 'Shillong' },
          { name: 'Tura' },
        ],
      },
      {
        name: 'Mizoram',
        cities: [
          { name: 'Aizawl' },
          { name: 'Lunglei' },
        ],
      },
      {
        name: 'Nagaland',
        cities: [
          { name: 'Kohima' },
          { name: 'Dimapur' },
        ],
      },
      {
        name: 'Odisha',
        cities: [
          { name: 'Bhubaneswar' },
          { name: 'Cuttack' },
          { name: 'Rourkela' },
          { name: 'Sambalpur' },
        ],
      },
      {
        name: 'Punjab',
        cities: [
          { name: 'Chandigarh' },
          { name: 'Amritsar' },
          { name: 'Ludhiana' },
          { name: 'Jalandhar' },
          { name: 'Patiala' },
        ],
      },
      {
        name: 'Rajasthan',
        cities: [
          { name: 'Jaipur' },
          { name: 'Jodhpur' },
          { name: 'Udaipur' },
          { name: 'Ajmer' },
          { name: 'Bikaner' },
          { name: 'Kota' },
        ],
      },
      {
        name: 'Sikkim',
        cities: [
          { name: 'Gangtok' },
          { name: 'Namchi' },
        ],
      },
      {
        name: 'Tamil Nadu',
        cities: [
          { name: 'Chennai' },
          { name: 'Coimbatore' },
          { name: 'Madurai' },
          { name: 'Salem' },
          { name: 'Tiruppur' },
          { name: 'Kanyakumari' },
        ],
      },
      {
        name: 'Telangana',
        cities: [
          { name: 'Hyderabad' },
          { name: 'Secunderabad' },
          { name: 'Warangal' },
          { name: 'Nizamabad' },
        ],
      },
      {
        name: 'Tripura',
        cities: [
          { name: 'Agartala' },
          { name: 'Udaipur' },
        ],
      },
      {
        name: 'Uttar Pradesh',
        cities: [
          { name: 'Lucknow' },
          { name: 'Kanpur' },
          { name: 'Agra' },
          { name: 'Varanasi' },
          { name: 'Meerut' },
          { name: 'Ghaziabad' },
          { name: 'Noida' },
          { name: 'Allahabad' },
        ],
      },
      {
        name: 'Uttarakhand',
        cities: [
          { name: 'Dehradun' },
          { name: 'Haridwar' },
          { name: 'Nainital' },
          { name: 'Rudraprayag' },
        ],
      },
      {
        name: 'West Bengal',
        cities: [
          { name: 'Kolkata' },
          { name: 'Darjeeling' },
          { name: 'Siliguri' },
          { name: 'Durgapur' },
          { name: 'Asansol' },
        ],
      },
      {
        name: 'Delhi',
        cities: [
          { name: 'New Delhi' },
          { name: 'Delhi' },
        ],
      },
      {
        name: 'Puducherry',
        cities: [
          { name: 'Puducherry' },
          { name: 'Yanam' },
          { name: 'Karaikal' },
        ],
      },
      {
        name: 'Ladakh',
        cities: [
          { name: 'Leh' },
          { name: 'Kargil' },
        ],
      },
      {
        name: 'Jammu and Kashmir',
        cities: [
          { name: 'Srinagar' },
          { name: 'Jammu' },
          { name: 'Anantnag' },
          { name: 'Samba' },
        ],
      },
    ],
  },
  {
    name: 'United States',
    states: [
      {
        name: 'California',
        cities: [
          { name: 'Los Angeles' },
          { name: 'San Francisco' },
          { name: 'San Diego' },
          { name: 'Sacramento' },
        ],
      },
      {
        name: 'Texas',
        cities: [
          { name: 'Houston' },
          { name: 'Dallas' },
          { name: 'Austin' },
          { name: 'San Antonio' },
        ],
      },
      {
        name: 'Florida',
        cities: [
          { name: 'Miami' },
          { name: 'Orlando' },
          { name: 'Tampa' },
          { name: 'Jacksonville' },
        ],
      },
      {
        name: 'New York',
        cities: [
          { name: 'New York City' },
          { name: 'Buffalo' },
          { name: 'Rochester' },
        ],
      },
    ],
  },
  {
    name: 'United Kingdom',
    states: [
      {
        name: 'England',
        cities: [
          { name: 'London' },
          { name: 'Manchester' },
          { name: 'Birmingham' },
          { name: 'Liverpool' },
        ],
      },
      {
        name: 'Scotland',
        cities: [
          { name: 'Edinburgh' },
          { name: 'Glasgow' },
          { name: 'Aberdeen' },
        ],
      },
    ],
  },
  {
    name: 'Canada',
    states: [
      {
        name: 'Ontario',
        cities: [
          { name: 'Toronto' },
          { name: 'Ottawa' },
          { name: 'Hamilton' },
        ],
      },
      {
        name: 'British Columbia',
        cities: [
          { name: 'Vancouver' },
          { name: 'Victoria' },
          { name: 'Surrey' },
        ],
      },
    ],
  },
  {
    name: 'Australia',
    states: [
      {
        name: 'New South Wales',
        cities: [
          { name: 'Sydney' },
          { name: 'Newcastle' },
          { name: 'Wollongong' },
        ],
      },
      {
        name: 'Victoria',
        cities: [
          { name: 'Melbourne' },
          { name: 'Geelong' },
          { name: 'Ballarat' },
        ],
      },
    ],
  },
];

export const getStatesForCountry = (countryName: string): State[] => {
  const country = COUNTRIES.find((c) => c.name === countryName);
  return country?.states || [];
};

export const getCitiesForState = (countryName: string, stateName: string): City[] => {
  const country = COUNTRIES.find((c) => c.name === countryName);
  const state = country?.states.find((s) => s.name === stateName);
  return state?.cities || [];
};

export const getCountryNames = (): string[] => {
  return COUNTRIES.map((c) => c.name);
};
