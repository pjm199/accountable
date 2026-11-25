import { LoadError, Loading } from "../components/PageHeader";
import { useDeals } from "../hooks/deals";
import { Board } from "./pipeline/Board";
import { Summary } from "./pipeline/Summary";
import "./pipeline/pipeline.css";

export default function Pipeline() {
  const { data, isPending, error } = useDeals();
  return (
    <main className="page">
      <h1 className="page-title">Pipeline</h1>
      <p className="page-hint">Drag a card to another column to change its stage, or within a column to change its place.</p>
      {isPending ? (
        <Loading />
      ) : error ? (
        <LoadError error={error} />
      ) : (
        <>
          <Summary deals={data} />
          <Board deals={data} />
        </>
      )}
    </main>
  );
}
