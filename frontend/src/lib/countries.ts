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
        ],
      },
    ],
  },
  {
    name: 'United States',
    states: [
      {
        name: 'Alabama',
        cities: [
          { name: 'Birmingham' },
          { name: 'Montgomery' },
          { name: 'Mobile' },
        ],
      },
      {
        name: 'Alaska',
        cities: [
          { name: 'Anchorage' },
          { name: 'Juneau' },
          { name: 'Fairbanks' },
        ],
      },
      {
        name: 'Arizona',
        cities: [
          { name: 'Phoenix' },
          { name: 'Tucson' },
          { name: 'Mesa' },
        ],
      },
      {
        name: 'California',
        cities: [
          { name: 'Los Angeles' },
          { name: 'San Francisco' },
          { name: 'San Diego' },
          { name: 'Sacramento' },
          { name: 'Oakland' },
        ],
      },
      {
        name: 'Colorado',
        cities: [
          { name: 'Denver' },
          { name: 'Colorado Springs' },
          { name: 'Boulder' },
        ],
      },
      {
        name: 'Connecticut',
        cities: [
          { name: 'Hartford' },
          { name: 'New Haven' },
          { name: 'Bridgeport' },
        ],
      },
      {
        name: 'Delaware',
        cities: [
          { name: 'Wilmington' },
          { name: 'Dover' },
        ],
      },
      {
        name: 'Florida',
        cities: [
          { name: 'Miami' },
          { name: 'Orlando' },
          { name: 'Tampa' },
          { name: 'Jacksonville' },
          { name: 'Fort Lauderdale' },
        ],
      },
      {
        name: 'Georgia',
        cities: [
          { name: 'Atlanta' },
          { name: 'Savannah' },
          { name: 'Augusta' },
        ],
      },
      {
        name: 'Illinois',
        cities: [
          { name: 'Chicago' },
          { name: 'Springfield' },
          { name: 'Aurora' },
        ],
      },
      {
        name: 'Indiana',
        cities: [
          { name: 'Indianapolis' },
          { name: 'Fort Wayne' },
          { name: 'Evansville' },
        ],
      },
      {
        name: 'Iowa',
        cities: [
          { name: 'Des Moines' },
          { name: 'Cedar Rapids' },
          { name: 'Davenport' },
        ],
      },
      {
        name: 'Kansas',
        cities: [
          { name: 'Kansas City' },
          { name: 'Wichita' },
          { name: 'Topeka' },
        ],
      },
      {
        name: 'Kentucky',
        cities: [
          { name: 'Louisville' },
          { name: 'Lexington' },
          { name: 'Bowling Green' },
        ],
      },
      {
        name: 'Louisiana',
        cities: [
          { name: 'New Orleans' },
          { name: 'Baton Rouge' },
          { name: 'Shreveport' },
        ],
      },
      {
        name: 'Massachusetts',
        cities: [
          { name: 'Boston' },
          { name: 'Worcester' },
          { name: 'Cambridge' },
        ],
      },
      {
        name: 'Maryland',
        cities: [
          { name: 'Baltimore' },
          { name: 'Annapolis' },
          { name: 'Frederick' },
        ],
      },
      {
        name: 'Michigan',
        cities: [
          { name: 'Detroit' },
          { name: 'Grand Rapids' },
          { name: 'Ann Arbor' },
        ],
      },
      {
        name: 'Minnesota',
        cities: [
          { name: 'Minneapolis' },
          { name: 'Saint Paul' },
          { name: 'Rochester' },
        ],
      },
      {
        name: 'Mississippi',
        cities: [
          { name: 'Jackson' },
          { name: 'Gulfport' },
          { name: 'Biloxi' },
        ],
      },
      {
        name: 'Missouri',
        cities: [
          { name: 'Kansas City' },
          { name: 'Saint Louis' },
          { name: 'Columbia' },
        ],
      },
      {
        name: 'Montana',
        cities: [
          { name: 'Billings' },
          { name: 'Missoula' },
          { name: 'Great Falls' },
        ],
      },
      {
        name: 'Nebraska',
        cities: [
          { name: 'Omaha' },
          { name: 'Lincoln' },
          { name: 'Bellevue' },
        ],
      },
      {
        name: 'Nevada',
        cities: [
          { name: 'Las Vegas' },
          { name: 'Henderson' },
          { name: 'Reno' },
        ],
      },
      {
        name: 'New Hampshire',
        cities: [
          { name: 'Manchester' },
          { name: 'Nashua' },
          { name: 'Concord' },
        ],
      },
      {
        name: 'New Jersey',
        cities: [
          { name: 'Newark' },
          { name: 'Jersey City' },
          { name: 'Paterson' },
        ],
      },
      {
        name: 'New Mexico',
        cities: [
          { name: 'Albuquerque' },
          { name: 'Santa Fe' },
          { name: 'Las Cruces' },
        ],
      },
      {
        name: 'New York',
        cities: [
          { name: 'New York City' },
          { name: 'Buffalo' },
          { name: 'Rochester' },
          { name: 'Yonkers' },
        ],
      },
      {
        name: 'North Carolina',
        cities: [
          { name: 'Charlotte' },
          { name: 'Raleigh' },
          { name: 'Greensboro' },
        ],
      },
      {
        name: 'Ohio',
        cities: [
          { name: 'Columbus' },
          { name: 'Cleveland' },
          { name: 'Cincinnati' },
          { name: 'Toledo' },
        ],
      },
      {
        name: 'Oklahoma',
        cities: [
          { name: 'Oklahoma City' },
          { name: 'Tulsa' },
          { name: 'Norman' },
        ],
      },
      {
        name: 'Oregon',
        cities: [
          { name: 'Portland' },
          { name: 'Eugene' },
          { name: 'Salem' },
        ],
      },
      {
        name: 'Pennsylvania',
        cities: [
          { name: 'Philadelphia' },
          { name: 'Pittsburgh' },
          { name: 'Allentown' },
        ],
      },
      {
        name: 'Rhode Island',
        cities: [
          { name: 'Providence' },
          { name: 'Warwick' },
          { name: 'Cranston' },
        ],
      },
      {
        name: 'South Carolina',
        cities: [
          { name: 'Charleston' },
          { name: 'Columbia' },
          { name: 'Greenville' },
        ],
      },
      {
        name: 'Tennessee',
        cities: [
          { name: 'Memphis' },
          { name: 'Nashville' },
          { name: 'Knoxville' },
        ],
      },
      {
        name: 'Texas',
        cities: [
          { name: 'Houston' },
          { name: 'Dallas' },
          { name: 'Austin' },
          { name: 'San Antonio' },
          { name: 'Fort Worth' },
        ],
      },
      {
        name: 'Utah',
        cities: [
          { name: 'Salt Lake City' },
          { name: 'Provo' },
          { name: 'Ogden' },
        ],
      },
      {
        name: 'Vermont',
        cities: [
          { name: 'Burlington' },
          { name: 'Montpelier' },
          { name: 'Rutland' },
        ],
      },
      {
        name: 'Virginia',
        cities: [
          { name: 'Richmond' },
          { name: 'Arlington' },
          { name: 'Alexandria' },
        ],
      },
      {
        name: 'Washington',
        cities: [
          { name: 'Seattle' },
          { name: 'Spokane' },
          { name: 'Tacoma' },
        ],
      },
      {
        name: 'Wisconsin',
        cities: [
          { name: 'Milwaukee' },
          { name: 'Madison' },
          { name: 'Green Bay' },
        ],
      },
      {
        name: 'Wyoming',
        cities: [
          { name: 'Cheyenne' },
          { name: 'Casper' },
          { name: 'Laramie' },
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
          { name: 'Leeds' },
        ],
      },
      {
        name: 'Scotland',
        cities: [
          { name: 'Edinburgh' },
          { name: 'Glasgow' },
          { name: 'Aberdeen' },
          { name: 'Dundee' },
        ],
      },
      {
        name: 'Wales',
        cities: [
          { name: 'Cardiff' },
          { name: 'Swansea' },
          { name: 'Newport' },
        ],
      },
      {
        name: 'Northern Ireland',
        cities: [
          { name: 'Belfast' },
          { name: 'Derry' },
          { name: 'Lisburn' },
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
          { name: 'London' },
        ],
      },
      {
        name: 'British Columbia',
        cities: [
          { name: 'Vancouver' },
          { name: 'Victoria' },
          { name: 'Surrey' },
          { name: 'Burnaby' },
        ],
      },
      {
        name: 'Alberta',
        cities: [
          { name: 'Calgary' },
          { name: 'Edmonton' },
          { name: 'Red Deer' },
        ],
      },
      {
        name: 'Manitoba',
        cities: [
          { name: 'Winnipeg' },
          { name: 'Brandon' },
        ],
      },
      {
        name: 'Saskatchewan',
        cities: [
          { name: 'Saskatoon' },
          { name: 'Regina' },
          { name: 'Prince Albert' },
        ],
      },
      {
        name: 'Quebec',
        cities: [
          { name: 'Montreal' },
          { name: 'Quebec City' },
          { name: 'Laval' },
        ],
      },
      {
        name: 'Nova Scotia',
        cities: [
          { name: 'Halifax' },
          { name: 'Cape Breton' },
        ],
      },
      {
        name: 'New Brunswick',
        cities: [
          { name: 'Saint John' },
          { name: 'Fredericton' },
          { name: 'Moncton' },
        ],
      },
      {
        name: 'Prince Edward Island',
        cities: [
          { name: 'Charlottetown' },
          { name: 'Summerside' },
        ],
      },
      {
        name: 'Newfoundland and Labrador',
        cities: [
          { name: 'St. Johns' },
          { name: 'Corner Brook' },
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
          { name: 'Central Coast' },
        ],
      },
      {
        name: 'Victoria',
        cities: [
          { name: 'Melbourne' },
          { name: 'Geelong' },
          { name: 'Ballarat' },
          { name: 'Bendigo' },
        ],
      },
      {
        name: 'Queensland',
        cities: [
          { name: 'Brisbane' },
          { name: 'Gold Coast' },
          { name: 'Sunshine Coast' },
          { name: 'Cairns' },
        ],
      },
      {
        name: 'South Australia',
        cities: [
          { name: 'Adelaide' },
          { name: 'Mount Gambier' },
          { name: 'Whyalla' },
        ],
      },
      {
        name: 'Western Australia',
        cities: [
          { name: 'Perth' },
          { name: 'Fremantle' },
          { name: 'Mandurah' },
        ],
      },
      {
        name: 'Tasmania',
        cities: [
          { name: 'Hobart' },
          { name: 'Launceston' },
          { name: 'Devonport' },
        ],
      },
      {
        name: 'Australian Capital Territory',
        cities: [
          { name: 'Canberra' },
          { name: 'Queanbeyan' },
        ],
      },
      {
        name: 'Northern Territory',
        cities: [
          { name: 'Darwin' },
          { name: 'Alice Springs' },
          { name: 'Palmerston' },
        ],
      },
    ],
  },
  {
    name: 'Germany',
    states: [
      {
        name: 'North Rhine-Westphalia',
        cities: [
          { name: 'Cologne' },
          { name: 'Dusseldorf' },
          { name: 'Dortmund' },
          { name: 'Essen' },
        ],
      },
      {
        name: 'Bavaria',
        cities: [
          { name: 'Munich' },
          { name: 'Nuremberg' },
          { name: 'Augsburg' },
        ],
      },
      {
        name: 'Baden-Württemberg',
        cities: [
          { name: 'Stuttgart' },
          { name: 'Mannheim' },
          { name: 'Karlsruhe' },
        ],
      },
      {
        name: 'Berlin',
        cities: [
          { name: 'Berlin' },
        ],
      },
      {
        name: 'Hesse',
        cities: [
          { name: 'Frankfurt' },
          { name: 'Wiesbaden' },
          { name: 'Darmstadt' },
        ],
      },
      {
        name: 'Saxony',
        cities: [
          { name: 'Leipzig' },
          { name: 'Dresden' },
          { name: 'Chemnitz' },
        ],
      },
    ],
  },
  {
    name: 'France',
    states: [
      {
        name: 'Ile-de-France',
        cities: [
          { name: 'Paris' },
          { name: 'Versailles' },
          { name: 'Boulogne-Billancourt' },
        ],
      },
      {
        name: 'Provence-Alpes-Côte d\'Azur',
        cities: [
          { name: 'Marseille' },
          { name: 'Nice' },
          { name: 'Cannes' },
        ],
      },
      {
        name: 'Auvergne-Rhône-Alpes',
        cities: [
          { name: 'Lyon' },
          { name: 'Grenoble' },
          { name: 'Saint-Etienne' },
        ],
      },
      {
        name: 'Occitanie',
        cities: [
          { name: 'Toulouse' },
          { name: 'Montpellier' },
          { name: 'Nîmes' },
        ],
      },
      {
        name: 'Nouvelle-Aquitaine',
        cities: [
          { name: 'Bordeaux' },
          { name: 'Limoges' },
          { name: 'Poitiers' },
        ],
      },
      {
        name: 'Brittany',
        cities: [
          { name: 'Rennes' },
          { name: 'Brest' },
          { name: 'Nantes' },
        ],
      },
    ],
  },
  {
    name: 'Japan',
    states: [
      {
        name: 'Tokyo',
        cities: [
          { name: 'Tokyo' },
          { name: 'Shinjuku' },
          { name: 'Shibuya' },
        ],
      },
      {
        name: 'Osaka',
        cities: [
          { name: 'Osaka' },
          { name: 'Kobe' },
          { name: 'Kyoto' },
        ],
      },
      {
        name: 'Kanagawa',
        cities: [
          { name: 'Yokohama' },
          { name: 'Kawasaki' },
          { name: 'Yokosuka' },
        ],
      },
      {
        name: 'Saitama',
        cities: [
          { name: 'Saitama' },
          { name: 'Kawagoe' },
          { name: 'Urawa' },
        ],
      },
      {
        name: 'Chiba',
        cities: [
          { name: 'Chiba' },
          { name: 'Matsudo' },
          { name: 'Funabashi' },
        ],
      },
      {
        name: 'Hokkaido',
        cities: [
          { name: 'Sapporo' },
          { name: 'Asahikawa' },
          { name: 'Hakodate' },
        ],
      },
    ],
  },
  {
    name: 'China',
    states: [
      {
        name: 'Beijing',
        cities: [
          { name: 'Beijing' },
          { name: 'Chaoyang' },
          { name: 'Haidian' },
        ],
      },
      {
        name: 'Shanghai',
        cities: [
          { name: 'Shanghai' },
          { name: 'Pudong' },
          { name: 'Huangpu' },
        ],
      },
      {
        name: 'Guangdong',
        cities: [
          { name: 'Guangzhou' },
          { name: 'Shenzhen' },
          { name: 'Dongguan' },
        ],
      },
      {
        name: 'Sichuan',
        cities: [
          { name: 'Chengdu' },
          { name: 'Mianyang' },
          { name: 'Leshan' },
        ],
      },
      {
        name: 'Shandong',
        cities: [
          { name: 'Jinan' },
          { name: 'Qingdao' },
          { name: 'Yantai' },
        ],
      },
      {
        name: 'Jiangsu',
        cities: [
          { name: 'Nanjing' },
          { name: 'Suzhou' },
          { name: 'Wuxi' },
        ],
      },
    ],
  },
  {
    name: 'Brazil',
    states: [
      {
        name: 'São Paulo',
        cities: [
          { name: 'São Paulo' },
          { name: 'Campinas' },
          { name: 'Santos' },
        ],
      },
      {
        name: 'Rio de Janeiro',
        cities: [
          { name: 'Rio de Janeiro' },
          { name: 'Niterói' },
          { name: 'Duque de Caxias' },
        ],
      },
      {
        name: 'Minas Gerais',
        cities: [
          { name: 'Belo Horizonte' },
          { name: 'Uberlândia' },
          { name: 'Juiz de Fora' },
        ],
      },
      {
        name: 'Bahia',
        cities: [
          { name: 'Salvador' },
          { name: 'Feira de Santana' },
          { name: 'Vitória da Conquista' },
        ],
      },
      {
        name: 'Ceará',
        cities: [
          { name: 'Fortaleza' },
          { name: 'Caucaia' },
          { name: 'Maracanaú' },
        ],
      },
      {
        name: 'Pernambuco',
        cities: [
          { name: 'Recife' },
          { name: 'Jaboatão' },
          { name: 'Olinda' },
        ],
      },
    ],
  },
  {
    name: 'Mexico',
    states: [
      {
        name: 'Mexico City',
        cities: [
          { name: 'Mexico City' },
          { name: 'Del Carmen' },
        ],
      },
      {
        name: 'State of Mexico',
        cities: [
          { name: 'Ecatepec' },
          { name: 'Naucalpan' },
          { name: 'Toluca' },
        ],
      },
      {
        name: 'Jalisco',
        cities: [
          { name: 'Guadalajara' },
          { name: 'Zapopan' },
          { name: 'Puerto Vallarta' },
        ],
      },
      {
        name: 'Veracruz',
        cities: [
          { name: 'Veracruz' },
          { name: 'Xalapa' },
          { name: 'Córdoba' },
        ],
      },
      {
        name: 'Puebla',
        cities: [
          { name: 'Puebla' },
          { name: 'Cholula' },
        ],
      },
      {
        name: 'Guanajuato',
        cities: [
          { name: 'León' },
          { name: 'Guanajuato' },
          { name: 'Irapuato' },
        ],
      },
    ],
  },
  {
    name: 'South Africa',
    states: [
      {
        name: 'Gauteng',
        cities: [
          { name: 'Johannesburg' },
          { name: 'Pretoria' },
          { name: 'Sokobela' },
        ],
      },
      {
        name: 'Western Cape',
        cities: [
          { name: 'Cape Town' },
          { name: 'Strand' },
          { name: 'Stellenbosch' },
        ],
      },
      {
        name: 'KwaZulu-Natal',
        cities: [
          { name: 'Durban' },
          { name: 'Pietermaritzburg' },
          { name: 'Newcastle' },
        ],
      },
      {
        name: 'Eastern Cape',
        cities: [
          { name: 'Port Elizabeth' },
          { name: 'East London' },
          { name: 'Gqeberha' },
        ],
      },
      {
        name: 'Limpopo',
        cities: [
          { name: 'Polokwane' },
          { name: 'Musina' },
        ],
      },
      {
        name: 'Mpumalanga',
        cities: [
          { name: 'Nelspruit' },
          { name: 'Witbank' },
        ],
      },
    ],
  },
  {
    name: 'Singapore',
    states: [
      {
        name: 'Central Singapore',
        cities: [
          { name: 'Singapore' },
          { name: 'Downtown' },
          { name: 'Marina Bay' },
        ],
      },
      {
        name: 'East Singapore',
        cities: [
          { name: 'Tampines' },
          { name: 'Pasir Ris' },
          { name: 'Bedok' },
        ],
      },
      {
        name: 'North Singapore',
        cities: [
          { name: 'Yishun' },
          { name: 'Sembawang' },
          { name: 'Woodlands' },
        ],
      },
      {
        name: 'West Singapore',
        cities: [
          { name: 'Jurong' },
          { name: 'Clementi' },
          { name: 'Bukit Batok' },
        ],
      },
    ],
  },
  {
    name: 'Malaysia',
    states: [
      {
        name: 'Selangor',
        cities: [
          { name: 'Kuala Lumpur' },
          { name: 'Petaling Jaya' },
          { name: 'Shah Alam' },
        ],
      },
      {
        name: 'Johor',
        cities: [
          { name: 'Johor Bahru' },
          { name: 'Kota Tinggi' },
          { name: 'Batu Pahat' },
        ],
      },
      {
        name: 'Penang',
        cities: [
          { name: 'George Town' },
          { name: 'Butterworth' },
          { name: 'Bayan Lepas' },
        ],
      },
      {
        name: 'Perak',
        cities: [
          { name: 'Ipoh' },
          { name: 'Klang' },
          { name: 'Taiping' },
        ],
      },
      {
        name: 'Sabah',
        cities: [
          { name: 'Kota Kinabalu' },
          { name: 'Sandakan' },
          { name: 'Tawau' },
        ],
      },
      {
        name: 'Sarawak',
        cities: [
          { name: 'Kuching' },
          { name: 'Sibu' },
          { name: 'Miri' },
        ],
      },
    ],
  },
  {
    name: 'Thailand',
    states: [
      {
        name: 'Bangkok',
        cities: [
          { name: 'Bangkok' },
          { name: 'Thonburi' },
          { name: 'Samut Prakan' },
        ],
      },
      {
        name: 'Chiang Mai',
        cities: [
          { name: 'Chiang Mai' },
          { name: 'Chiang Rai' },
          { name: 'Lampang' },
        ],
      },
      {
        name: 'Eastern Thailand',
        cities: [
          { name: 'Pattaya' },
          { name: 'Rayong' },
          { name: 'Chonburi' },
        ],
      },
      {
        name: 'Central Thailand',
        cities: [
          { name: 'Ayutthaya' },
          { name: 'Nakhon Pathom' },
          { name: 'Samut Sakhon' },
        ],
      },
      {
        name: 'Northeastern Thailand',
        cities: [
          { name: 'Khon Kaen' },
          { name: 'Nakhon Ratchasima' },
          { name: 'Udon Thani' },
        ],
      },
      {
        name: 'Southern Thailand',
        cities: [
          { name: 'Phuket' },
          { name: 'Hat Yai' },
          { name: 'Krabi' },
        ],
      },
    ],
  },
  {
    name: 'Indonesia',
    states: [
      {
        name: 'Java',
        cities: [
          { name: 'Jakarta' },
          { name: 'Surabaya' },
          { name: 'Bandung' },
          { name: 'Semarang' },
        ],
      },
      {
        name: 'Sumatra',
        cities: [
          { name: 'Medan' },
          { name: 'Palembang' },
          { name: 'Pekanbaru' },
        ],
      },
      {
        name: 'Bali',
        cities: [
          { name: 'Denpasar' },
          { name: 'Ubud' },
          { name: 'Seminyak' },
        ],
      },
      {
        name: 'Kalimantan',
        cities: [
          { name: 'Banjarmasin' },
          { name: 'Pontianak' },
          { name: 'Samarinda' },
        ],
      },
      {
        name: 'Sulawesi',
        cities: [
          { name: 'Makassar' },
          { name: 'Manado' },
          { name: 'Gorontalo' },
        ],
      },
      {
        name: 'Papua',
        cities: [
          { name: 'Jayapura' },
          { name: 'Manokwari' },
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
