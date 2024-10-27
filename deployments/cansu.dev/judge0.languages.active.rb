@languages ||= []
@languages +=
[
  {
    id: 43,
    name: "Plain Text",
    is_archived: false,
    source_file: "text.txt",
    run_cmd: "/bin/cat text.txt"
  },
  {
    id: 44,
    name: "Executable",
    is_archived: false,
    source_file: "a.out",
    run_cmd: "/bin/chmod +x a.out && ./a.out"
  },
  {
    id: 45,
    name: "Assembly (NASM 2.16.03)",
    is_archived: false,
    source_file: "main.asm",
    compile_cmd: "/usr/local/nasm-2.16.03/bin/nasmld -f elf64 %s main.asm",
    run_cmd: "./a.out"
  },
  {
    id: 46,
    name: "Bash (5.2.37)",
    is_archived: false,
    source_file: "script.sh",
    run_cmd: "/usr/local/bash-5.2.37/bin/bash script.sh"
  },
  {
    id: 48,
    name: "C (GCC 10.2)",
    is_archived: false,
    source_file: "main.c",
    compile_cmd: "/usr/local/gcc-10.2/bin/gcc %s main.c",
    run_cmd: "./a.out"
  },
  {
    id: 49,
    name: "C (GCC 11.5)",
    is_archived: false,
    source_file: "main.c",
    compile_cmd: "/usr/local/gcc-11.5/bin/gcc %s main.c",
    run_cmd: "./a.out"
  },
  {
    id: 50,
    name: "C (GCC 12.4)",
    is_archived: false,
    source_file: "main.c",
    compile_cmd: "/usr/local/gcc-12.4/bin/gcc %s main.c",
    run_cmd: "./a.out"
  },
  {
    id: 51,
    name: "C# (Mono 6.6.0.161)",
    is_archived: false,
    source_file: "Main.cs",
    compile_cmd: "/usr/local/mono-6.6.0.161/bin/mcs %s Main.cs",
    run_cmd: "/usr/local/mono-6.6.0.161/bin/mono Main.exe"
  },
  {
    id: 52,
    name: "C++ (GCC 10.2)",
    is_archived: false,
    source_file: "main.cpp",
    compile_cmd: "/usr/local/gcc-10.2/bin/g++ %s main.cpp",
    run_cmd: "LD_LIBRARY_PATH=/usr/local/gcc-10.2/lib64 ./a.out"
  },
  {
    id: 53,
    name: "C++ (GCC 11.5)",
    is_archived: false,
    source_file: "main.cpp",
    compile_cmd: "/usr/local/gcc-11.5/bin/g++ %s main.cpp",
    run_cmd: "LD_LIBRARY_PATH=/usr/local/gcc-11.5/lib64 ./a.out"
  },
  {
    id: 54,
    name: "C++ (GCC 12.4)",
    is_archived: false,
    source_file: "main.cpp",
    compile_cmd: "/usr/local/gcc-12.4/bin/g++ %s main.cpp",
    run_cmd: "LD_LIBRARY_PATH=/usr/local/gcc-12.4/lib64 ./a.out"
  },
  {
    id: 55,
    name: "Common Lisp (SBCL 2.4.9)",
    is_archived: false,
    source_file: "script.lisp",
    run_cmd: "ASDF_SBCL_VERSION=2.4.9 asdf exec sbcl --script script.lisp"
  },
  {
    id: 56,
    name: "D (DMD 2.109.1)",
    is_archived: false,
    source_file: "main.d",
    compile_cmd: "ASDF_DMD_VERSION=2.109.1 asdf exec dmd %s main.d",
    run_cmd: "./main"
  },
  {
    id: 57,
    name: "Elixir (1.17.3)",
    is_archived: false,
    source_file: "script.exs",
    run_cmd: "ASDF_ELIXIR_VERSION=1.17.3 asdf exec elixir script.exs"
  },
  {
    id: 58,
    name: "Erlang (OTP 27.1.2)",
    is_archived: false,
    source_file: "main.erl",
    run_cmd: "/bin/sed -i '1s/^/\\n/' main.erl && ASDF_ERLANG_VERSION=27.1.2 asdf exec escript main.erl"
  },
  {
    id: 59,
    name: "Fortran (GFortran 13.3)",
    is_archived: false,
    source_file: "main.f90",
    compile_cmd: "/usr/bin/gfortran %s main.f90",
    run_cmd: "LD_LIBRARY_PATH=/usr/local/gcc-13.3/lib64 ./a.out"
  },
  {
    id: 60,
    name: "Go (1.23.2)",
    is_archived: false,
    source_file: "main.go",
    compile_cmd: "ASDF_GOLANG_VERSION=1.23.2 GOCACHE=/tmp/.cache/go-build asdf exec go build %s main.go",
    run_cmd: "./main"
  },
  {
    id: 61,
    name: "Haskell (7.8.4)",
    is_archived: false,
    source_file: "main.hs",
    compile_cmd: "ASDF_GHC_VERSION=7.8.4 ASDF_HASKELL_VERSION=7.8.4 asdf exec ghc %s main.hs",
    run_cmd: "./main"
  },
  {
    id: 62,
    name: "Java (OpenJDK 23)",
    is_archived: false,
    source_file: "Main.java",
    compile_cmd: "/usr/local/openjdk23/bin/javac %s Main.java",
    run_cmd: "/usr/local/openjdk23/bin/java Main"
  },
  {
    id: 63,
    name: "JavaScript (Bun 1.1.33)",
    is_archived: false,
    source_file: "script.js",
    run_cmd: "ASDF_BUN_VERSION=1.1.33 asdf exec bun script.js"
  },
  {
    id: 64,
    name: "Lua (5.4.7)",
    is_archived: false,
    source_file: "script.lua",
    compile_cmd: "asdf exec luac %s script.lua",
    run_cmd: "ASDF_LUA_VERSION=5.4.7 asdf exec lua ./luac.out"
  },
  {
    id: 65,
    name: "OCaml (5.2.0)",
    is_archived: false,
    source_file: "main.ml",
    compile_cmd: "ocamlc %s main.ml",
    run_cmd: "./a.out"
  },
  {
    id: 66,
    name: "Octave (9.2.0)",
    is_archived: false,
    source_file: "script.m",
    run_cmd: "/usr/local/octave-9.2.0/bin/octave-cli -q --no-gui --no-history script.m"
  },
  {
    id: 67,
    name: "Pascal (FPC 3.2.2)",
    is_archived: false,
    source_file: "main.pas",
    compile_cmd: "/usr/local/fpc-3.2.2/bin/fpc %s main.pas",
    run_cmd: "./main"
  },
  {
    id: 68,
    name: "PHP (8.3.13)",
    is_archived: false,
    source_file: "script.php",
    run_cmd: "/usr/local/php-8.3.13/bin/php script.php"
  },
  {
    id: 69,
    name: "Prolog (GNU Prolog 1.4.5)",
    is_archived: false,
    source_file: "main.pro",
    compile_cmd: "PATH=\"/usr/lib/gprolog/bin:$PATH\" /usr/lib/gprolog/bin/gplc --no-top-level %s main.pro",
    run_cmd: "./main"
  },
  {
    id: 70,
    name: "Python (2.7.17)",
    is_archived: false,
    source_file: "script.py",
    run_cmd: "ASDF_PYTHON2_VERSION=2.7.17 ASDF_PYTHON_VERSION=2.7.17 asdf exec python2 script.py"
  },
  {
    id: 71,
    name: "Python (3.12.7)",
    is_archived: false,
    source_file: "script.py",
    run_cmd: "ASDF_PYTHON3_VERSION=3.12.7 ASDF_PYTHON_VERSION=3.12.7 asdf exec python3 script.py"
  },
  {
    id: 72,
    name: "Ruby (2.7.0)",
    is_archived: false,
    source_file: "script.rb",
    run_cmd: "ruby script.rb"
  },
  {
    id: 73,
    name: "Rust (1.82.0)",
    is_archived: false,
    source_file: "main.rs",
    compile_cmd: "ASDF_RUST_VERSION=1.82.0 asdf exec rustc %s main.rs",
    run_cmd: "./main"
  },
  {
    id: 74,
    name: "TypeScript (Bun 1.1.33)",
    is_archived: false,
    source_file: "script.ts",
    run_cmd: "ASDF_BUN_VERSION=1.1.33 asdf exec bun script.ts"
  },
  {
    id: 75,
    name: "C (Clang 19.1.0)",
    is_archived: false,
    source_file: "main.c",
    compile_cmd: "clang %s main.c",
    run_cmd: "./a.out"
  },
  {
    id: 76,
    name: "C++ (Clang 19.1.0)",
    is_archived: false,
    source_file: "main.cpp",
    compile_cmd: "clang %s main.cpp",
    run_cmd: "./a.out"
  },
  {
    id: 77,
    name: "COBOL (GnuCOBOL 3.1.2)",
    is_archived: false,
    source_file: "main.cob",
    compile_cmd: "/usr/local/gnucobol-3.1.2/bin/cobc -free -x %s main.cob",
    run_cmd: "LD_LIBRARY_PATH=/usr/local/gnucobol-3.1.2/lib ./main"
  },
  {
    id: 78,
    name: "Kotlin (2.0.21)",
    is_archived: false,
    source_file: "Main.kt",
    compile_cmd: "ASDF_KOTLIN_VERSION=2.0.21 asdf exec kotlinc %s Main.kt",
    run_cmd: "ASDF_KOTLIN_VERSION=2.0.21 asdf exec kotlin MainKt"
  },
  {
    id: 79,
    name: "Objective-C (Clang 7.0.1)",
    is_archived: false,
    source_file: "main.m",
    compile_cmd: "clang `gnustep-config --objc-flags | sed 's/-W[^ ]* //g'` `gnustep-config --base-libs | sed 's/-shared-libgcc//'` -I/usr/lib/gcc/x86_64-linux-gnu/8/include main.m %s",
    run_cmd: "./a.out"
  },
  {
    id: 80,
    name: "R (4.4.1)",
    is_archived: false,
    source_file: "script.r",
    run_cmd: "/usr/local/r-4.4.1/bin/Rscript script.r"
  },
  {
    id: 81,
    name: "Scala (3.5.2)",
    is_archived: false,
    source_file: "Main.scala",
    compile_cmd: "/usr/local/scala-3.5.2/bin/scalac %s Main.scala",
    run_cmd: "/usr/local/scala-3.5.2/bin/scala run -cp . -M Main"
  },
  {
    id: 82,
    name: "SQL (SQLite 3.27.2)",
    is_archived: false,
    source_file: "script.sql",
    run_cmd: "/bin/cat script.sql | /usr/bin/sqlite3 db.sqlite"
  },
  {
    id: 83,
    name: "Swift (6.0.1)",
    is_archived: false,
    source_file: "Main.swift",
    compile_cmd: "/usr/local/swift-6.0.1/bin/swiftc %s Main.swift",
    run_cmd: "./Main"
  },
  {
    id: 84,
    name: "Visual Basic.Net (vbnc 0.0.0.5943)",
    is_archived: false,
    source_file: "Main.vb",
    compile_cmd: "/usr/bin/vbnc %s Main.vb",
    run_cmd: "/usr/bin/mono Main.exe"
  },
  {
    id: 85,
    name: "Perl (5.40.0)",
    is_archived: false,
    source_file: "script.pl",
    run_cmd: "/usr/bin/perl script.pl"
  },
  {
    id: 86,
    name: "Clojure (1.11.2)",
    is_archived: false,
    source_file: "main.clj",
    run_cmd: "/usr/local/bin/clojure clojure main.clj"
  },
  {
    id: 87,
    name: "Nim (2.2.0)",
    is_archived: false,
    source_file: "main.nim",
    compile_cmd: "ASDF_NIM_VERSION=2.2.0 asdf exec nim compile %s main.nim",
    run_cmd: "./main"
  },
  {
    id: 88,
    name: "Groovy (4.0.23)",
    is_archived: false,
    source_file: "script.groovy",
    compile_cmd: "/usr/local/groovy-4.0.23/bin/groovyc %s script.groovy",
    run_cmd: "/usr/local/bin/java -cp \".:/usr/local/groovy-4.0.23/lib/*\" script"
  },
  {
    id: 89,
    name: "Multi-file program",
    is_archived: false,
  },
  {
    id: 90,
    name: "C (GCC 13.3)",
    is_archived: false,
    source_file: "main.c",
    compile_cmd: "/usr/local/gcc-13.3/bin/gcc %s main.c",
    run_cmd: "./a.out"
  },
  {
    id: 91,
    name: "C++ (GCC 13.3)",
    is_archived: false,
    source_file: "main.cpp",
    compile_cmd: "/usr/local/gcc-13.3/bin/g++ %s main.cpp",
    run_cmd: "LD_LIBRARY_PATH=/usr/local/gcc-13.3/lib64 ./a.out"
  }
]