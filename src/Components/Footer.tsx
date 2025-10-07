function Footer() {
  return (
    <div className="mt-auto bg-black/80 text-white py-4 sm:py-6">
      <div className="max-w-screen-lg mx-auto text-center px-4">
        <p className="text-sm sm:text-base md:text-lg">
          &copy; {new Date().getFullYear()} The Elder Cards. Todos los derechos
          reservados.
        </p>
      </div>
    </div>
  );
}
export default Footer;
