import "./App.css";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import ColCard from "./Components/ColCard";

function App() {
  return (
    <Container className="mt-5">
      <Row>
        <ColCard />
        <ColCard></ColCard>
        <ColCard></ColCard>
        <ColCard></ColCard>
      </Row>
      <Button>Push Me</Button>
    </Container>
  );
}

export default App;
