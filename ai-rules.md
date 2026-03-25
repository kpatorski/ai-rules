# AI RULES

## General

Za kazdym razem gdy agent AI wykonuje zadania reguly umieszczone w tym pliku oraz jego odnosnikach MUSZA byc brane pod uwagę.
Reguly znajdujace sie bezposrednio w podkatalogach projektow nad ktorymi pracuje agent AI rowniez musza byc brane pod uwage.
Lista podkatalogow ktorych to dotyczy:
- .claude
- .clinerules
- .cline
- .gemini

## Praca z kodem

- gdy tworzysz nowe klasy albo gdy wprowadzasz zmiany w zawsze zaczynaj od testow, nigdy od kodu produkcyjnego -> TDD
- zawsze weryfikuj czy kod sie kompiluje i czy testy dalej przechodza, jesli nie, nie idz do kolejnego zadania, pracuj iteracyjnie
- uzywaj defaultowego formatowania zgodnie z konwencja Jezyka

### Clean code

#### Enkapsulacja

Zawsze preferuj nizszy poziom (private -> package private -> public) jako defaultowy accessor. Zwiększaj widocznosc tylko wtedy gdy jest to potrzebne lub gdy wymaga tego framework.
Nie wystawiaj na widok stanu klasy jesli nie jest to konieczne. Uwzglednij zasady z dzialu Architecture.

#### Lombok

Preferuj Lombokowe adnotacje nad pisanym kodem.
Jeśli projekt nie ma skonfigurowanego defaultowego chainowania i fluent Getterow i Setterow staraj sie takie dodawac, chyba ze jest to niemozliwe ze wzgledu na wymagania frameworka (np. Beany albo proxy)


#### interfejsy > dziedziczenie

Nie korzystaj z dziedziczenia chyba ze jest to niezbedne. Preferuj interfejsy.
Nie tworz interfejsow jesli istnieje duze prawdopodobnienstwo, ze bedzie tylko jedna implementacja. Nigdy, ale to nigdy nie tworz interfejsow z suffixem typu "Impl".

#### Nazewnictwo

Uzywaj jednoznacznych nazw klas, metod, zmiennych, pakietow.
Podazaj za jezykiem domeny.
Nigdy, nie uzywaj nazw typu "helper", "util", "manager", "handle", "maintain", "resolver" etc. Takie metody swiadcza o naruszeniu SOLID.
Unikaj przedrostkow "get", "set" jesli to mozliwe.
Nie uzywaj nic nieznaczacych skrotow, abrewiacji. 
Nie wszystko musi byc odrzeczownikowe, klasy odczasownikowe (usecasowe) sa preferowane np. ItemCreator -> CreateItem

#### Styl funkcjonalny

Preferuj styl funkcyjny. Korzystaj z takich klas jak np. Optional, Result, Either, Stream.

#### Null

Nigdy nie przekazuj nulli, chyba ze jest to wymagane przez jakis zewnetrzny framework. Zamiast tego korzystaj z klas takich jak: Optional, Result, Either. 
Nie pisz defensywnego sprawdzania nulli do wewnetrznego kodu. Zakladaj, ze wewnatrz projektu nikt nie przekazuje nuli. 

#### Wyjatki

Preferuj Result, Optional zamiast rzucanie wyjatkow. Gdy juz rzucasz wyjatek nigdy nie rzucaj zadeklarowanych. Opakuj wyjatek w dedykowany, dobrze nazwany Runtimowy wyjatek.
Mozesz definiowac taki wyjatek jako inner class, z prywatnym konstruktorem.

#### Komentarze

Nigdy nie dodawaj komentarzy aby tlumaczy dzialanie kodu. To kod powinien tlumaczyc sie sam.

#### Libraries

Przed dodaniem klasy, metody typu utility jak na przyklad "String emptyIfNull(String value)" sprawdz czy nie istnieja takie metody w popularnych bibliotekach jak apache commons, vavr

#### Return nothing

W metodach void nigdy nie zwracaj return;

#### Cognitive overload

Nie przeciazaj mozgu czytajacego kod. 

#### SOLID

Zawsze i bezwzglednie przestrzegaj zasad SOLID.

#### Duplikat kodu

Uwazaj na pozorna duplikacje kodu. Zawsze rozpatruj ja przez pryzmat SOLID i zasad z dzialu Architecture

#### Newest API

Korzystaj z najnowszych rozwiazan z API jezyka. Np. zamiast konkatenacji Stringow uzyj String.formatted()
Dla zwiekszenia czytelnosci importuj statyczne metody jesli metoda dobrze i jednoznacznie opisuje co się dzieje np. "Optional.nullable()" -> "nullable()", albo "emptyIfNull()"

### Testing

#### TDD

Zaczynaj od TDD. 

#### BDD

Preferuj BDD. Definiuj przypadki testowe tak jakby opisywal je product owner. Skup się na zachowaniu a nie na implementacji.
Mysl w kategoriach scenariuszy. Pisz testy ktore opisuja co robi system, a nie jak to robi.
Badz specyficzny w nazywnictwie. Nie zostawiaj pola do interpretacji np. zamiast "validNameTest()" -> "emptyNameIsRejected()" albo "validationTest()" -> "validRecordIsSavedToDatabase()"
Staraj sie nie uwzgledniach nazwy testowanej metody w nazwie testu. Wyjatkiem sa klasy Utility i ich testy.

#### Chicago School vs London School

Preferuj Chicago School. Weryfikuj obserwowalne zachowanie, a nie stan klas
Unikaj korzystania z mockow i weryfikacji interakcji jesli to mozliwe i ma sens. 
Staraj sie pisac testy odporne na refactoring.
Unikaj zalezenia od mockowania

#### Black box testing vs White box testing

Preferuj Black box testing.
Testuj poprzez publiczne i package-private interfejsy.
Nie testuj prywatnych metod bezposrednio
Nie weryfikuj wewnetrznego stanu
Skup sie na input/output behaviour
Nie testuj bezposrednio wewnetrznych szczegolow
Nie korzystaj z reflekcji

#### Unit

Unit nie oznacza tylko pojedynczej klasy. Unit to rowniez pakiet. Staraj sie testowac poprzez wejscie do pakietu niz poprzez pojedyncze klasy.
Jesli ilosc przypadkow brzegowych jest duza utworz dedykowany test pod nie wszystkie.


#### Kiedy mockowac

Dobrym powodem do uzycia mocka jest:

- zewnetrzny serwis (SFTP, DB etc)
- Non-deterministic behavior (current-time, random numbers)
- Triggering error conditions
- gdy testowana klasa ma zaleznosc do klasy o wielu przypadkach brzegowych i ktora juz jest otestowana w osobnej suite 


#### Fixtures

Tworz fixtures dla skomplikowanych, duzych obiektow testowych, albo gdy widzisz powtarzalnosc w ramach pakietu.
Uzywaj naturalnego jezyka, ktory nie zdradza szczegolow technicznych.

### Architecture

Podazaj za zasadami DDD.
Preferuj architektury Clean Architecture, Hexagonal, Onion architecture.
Enkapsuluj klasy i bounded konteksty. 

