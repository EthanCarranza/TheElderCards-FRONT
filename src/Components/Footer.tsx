function Footer() {
  return (
    <div className="bg-black/80 text-white py-6">
      <div className="max-w-screen-lg mx-auto text-center">
        <p className="text-lg">
          &copy; {new Date().getFullYear()} The Elder Cards. Todos los derechos
          reservados.
        </p>
      </div>
    </div>
  );
}

export default Footer;
